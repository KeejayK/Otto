const express = require('express');
const router = express.Router();
const multer = require('multer');
const { OpenAI } = require('openai');
const admin = require('firebase-admin');
const { google } = require('googleapis');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported'), false);
    }
  }
});

// Middleware to verify Firebase auth
const verifyToken = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get Google OAuth tokens for a user
const getGoogleTokens = async (userId) => {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  return userData.googleTokens;
};

// Get authenticated Google calendar client
const getCalendarClient = async (userId) => {
  const tokens = await getGoogleTokens(userId);
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
  
  oauth2Client.setCredentials(tokens);
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Function to extract class schedule from image
const extractClassScheduleFromImage = async (imageUrl) => {
  try {
    // Use OpenAI's vision model to extract class schedule information
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `Extract class schedule details from this image.
              
              For each class, identify:
              1. Course name and code
              2. Days of the week (Monday, Tuesday, etc.)
              3. Start and end time
              4. Location
              5. Instructor (if available)
              
              Format your response as a JSON array with the following structure:
              [
                {
                  "course": "CSE 451 - Operating Systems",
                  "days": ["Monday", "Wednesday", "Friday"],
                  "startTime": "10:30",
                  "endTime": "11:20",
                  "location": "CSE 101",
                  "instructor": "Prof. Smith"
                }
              ]
              
              Only include classes with specific days and times. Ignore any other information in the image.`
            },
            { 
              type: 'image_url', 
              image_url: { url: imageUrl } 
            }
          ]
        }
      ],
      max_tokens: 4096
    });
    
    // Try to parse the response as JSON
    try {
      // Extract the JSON part from the text response
      const textResponse = response.choices[0].message.content;
      
      // Find opening and closing brackets for JSON array
      const startIdx = textResponse.indexOf('[');
      const endIdx = textResponse.lastIndexOf(']') + 1;
      
      if (startIdx === -1 || endIdx === 0) {
        throw new Error('JSON array not found in response');
      }
      
      const jsonText = textResponse.substring(startIdx, endIdx);
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      
      // If JSON parsing fails, make a second attempt with a more explicit JSON request
      const secondAttempt = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You extract structured data from text. Always respond with valid JSON.'
          },
          { 
            role: 'user', 
            content: `Convert this class schedule information to JSON format:
            
            ${response.choices[0].message.content}
            
            Format as an array of class objects with: course, days, startTime, endTime, location, and instructor.`
          }
        ],
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(secondAttempt.choices[0].message.content);
    }
  } catch (error) {
    console.error('Schedule extraction error:', error);
    throw new Error('Failed to extract schedule from image');
  }
};

// Function to convert schedule to calendar events
const scheduleToCalendarEvents = (schedule) => {
  // Get the next occurrence of each day of the week
  const getNextDayOccurrence = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const todayDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const targetDayIndex = days.findIndex(day => day === dayName);
    
    // Calculate days to add (if today is the target day, use next week)
    let daysToAdd = (targetDayIndex - todayDayIndex + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // If it's the same day, go to next week
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  };
  
  // Generate recurring events for the semester (default 14 weeks)
  const events = [];
  
  schedule.forEach(classInfo => {
    const { course, days, startTime, endTime, location, instructor } = classInfo;
    
    // For each day of the week the class meets
    days.forEach(day => {
      // Get the next occurrence of this day
      const startDate = getNextDayOccurrence(day);
      
      // Set the time for start and end
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Create recurring event for 14 weeks (standard semester length)
      for (let week = 0; week < 14; week++) {
        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + (week * 7)); // Add weeks
        
        // Create event start time
        const eventStart = new Date(eventDate);
        eventStart.setHours(startHour, startMinute, 0);
        
        // Create event end time
        const eventEnd = new Date(eventDate);
        eventEnd.setHours(endHour, endMinute, 0);
        
        // Create event object
        events.push({
          summary: course,
          description: `Instructor: ${instructor || 'N/A'}`,
          start: {
            dateTime: eventStart.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
          end: {
            dateTime: eventEnd.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
          location: location || 'N/A',
          recurrence: [], // Individual events are easier to manage than recurrence rule
        });
      }
    });
  });
  
  return events;
};

// Upload and process class schedule image
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Upload file to Firebase Storage
    const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const fileName = `schedules/${req.user.uid}/${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(fileName);
    
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });
    
    // Get public URL
    await file.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    // Store schedule info in Firestore
    const scheduleRef = await admin.firestore().collection('schedules').add({
      userId: req.user.uid,
      fileName: req.file.originalname,
      fileUrl,
      fileType: req.file.mimetype,
      processingStatus: 'processing',
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Extract class schedule from image
    const extractedSchedule = await extractClassScheduleFromImage(fileUrl);
    
    // Update schedule with extracted classes
    await scheduleRef.update({
      extractedClasses: extractedSchedule,
      processingStatus: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Convert schedule to calendar events
    const calendarEvents = scheduleToCalendarEvents(extractedSchedule);
    
    res.json({ 
      scheduleId: scheduleRef.id, 
      classes: extractedSchedule,
      calendarEvents
    });
  } catch (error) {
    console.error('Schedule upload error:', error);
    res.status(500).json({ error: 'Failed to process schedule image' });
  }
});

// Add schedule to calendar
router.post('/add-to-calendar/:scheduleId', verifyToken, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { classIndices } = req.body; // Array of class indices to add (if not provided, add all)
    
    // Get schedule
    const scheduleDoc = await admin.firestore()
      .collection('schedules')
      .doc(scheduleId)
      .get();
    
    if (!scheduleDoc.exists) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const scheduleData = scheduleDoc.data();
    
    // Check if user owns the schedule
    if (scheduleData.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to access this schedule' });
    }
    
    // Get classes to add
    let classesToAdd = scheduleData.extractedClasses || [];
    
    if (classIndices && classIndices.length > 0) {
      // Filter classes by index if specific indices were provided
      classesToAdd = classesToAdd.filter((_, index) => classIndices.includes(index.toString()));
    }
    
    if (classesToAdd.length === 0) {
      return res.status(400).json({ error: 'No classes to add' });
    }
    
    // Convert to calendar events
    const calendarEvents = scheduleToCalendarEvents(classesToAdd);
    
    // Get calendar client
    const calendar = await getCalendarClient(req.user.uid);
    
    // Add events to calendar
    const addedEvents = [];
    const failedEvents = [];
    
    for (const event of calendarEvents) {
      try {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });
        
        addedEvents.push({
          summary: event.summary,
          start: event.start,
          googleEventId: response.data.id,
        });
      } catch (error) {
        console.error('Failed to add event:', error);
        failedEvents.push(event);
      }
    }
    
    res.json({
      success: true,
      added: addedEvents.length,
      failed: failedEvents.length,
      events: addedEvents,
    });
  } catch (error) {
    console.error('Calendar add error:', error);
    res.status(500).json({ error: 'Failed to add schedule to calendar' });
  }
});

// Get all schedules
router.get('/', verifyToken, async (req, res) => {
  try {
    const scheduleRef = admin.firestore()
      .collection('schedules')
      .where('userId', '==', req.user.uid)
      .orderBy('uploadedAt', 'desc');
    
    const scheduleSnapshot = await scheduleRef.get();
    const schedules = [];
    
    scheduleSnapshot.forEach(doc => {
      const data = doc.data();
      schedules.push({
        id: doc.id,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        uploadedAt: data.uploadedAt?.toDate(),
        processingStatus: data.processingStatus,
        classCount: data.extractedClasses?.length || 0,
      });
    });
    
    res.json(schedules);
} catch (error) {
  console.error('Schedule fetch error:', error);
  res.status(500).json({ error: 'Failed to fetch schedules' });
}
});

// Get schedule details
router.get('/:scheduleId', verifyToken, async (req, res) => {
try {
  const { scheduleId } = req.params;
  
  const scheduleDoc = await admin.firestore()
    .collection('schedules')
    .doc(scheduleId)
    .get();
  
  if (!scheduleDoc.exists) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  const scheduleData = scheduleDoc.data();
  
  // Check if user owns the schedule
  if (scheduleData.userId !== req.user.uid) {
    return res.status(403).json({ error: 'Not authorized to access this schedule' });
  }
  
  res.json({
    id: scheduleDoc.id,
    ...scheduleData,
    uploadedAt: scheduleData.uploadedAt?.toDate(),
    processedAt: scheduleData.processedAt?.toDate(),
  });
} catch (error) {
  console.error('Schedule fetch error:', error);
  res.status(500).json({ error: 'Failed to fetch schedule details' });
}
});

module.exports = router;