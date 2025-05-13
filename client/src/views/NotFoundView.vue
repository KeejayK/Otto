<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <p>Page not found</p>
      <router-link to="/" class="back-button">Go to Home</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 8rem);
}

.not-found-content {
  text-align: center;
}

h1 {
  font-size: 5rem;
  font-weight: 700;
  color: #4299e1;
  margin: 0;
}

p {
  font-size: 1.5rem;
  color: #4a5568;
  margin: 1rem 0 2rem;
}

.back-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #4299e1;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #3182ce;
}
</style>
