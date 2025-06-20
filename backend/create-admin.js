const axios = require('axios');

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      username: 'admin',
      email: 'admin@bookstore.com',
      password: 'admin123',
      role: 'admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@bookstore.com');
    console.log('Password: admin123');
    console.log('Token:', response.data.token);
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
      console.log('ℹ️ Admin user already exists!');
      console.log('Email: admin@bookstore.com');
      console.log('Password: admin123');
    } else {
      console.error('❌ Error creating admin user:', error.response?.data || error.message);
    }
  }
}

createAdmin();
