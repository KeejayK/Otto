/**
 * Simple utility to check if all required environment variables are set
 */
function checkRequiredEnvVars() {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OPENAI_API_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('ERROR: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`- ${varName}`);
    });
    console.error('Please set these variables in your environment or .env file');
    return false;
  }
  
  console.log('✓ All required environment variables are set');
  return true;
}

module.exports = { checkRequiredEnvVars };
