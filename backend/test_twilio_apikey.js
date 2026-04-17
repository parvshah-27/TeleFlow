require('dotenv').config();
const twilio = require('twilio');

const apiKeySid = process.env.TWILIO_API_KEY_SID;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log('API Key SID:', apiKeySid);
console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken ? 'Present' : 'Missing');

// Using API Key and Secret (Auth Token is often the Secret if using API Key)
const client = twilio(apiKeySid, authToken, { accountSid: accountSid });

client.api.accounts(accountSid)
  .fetch()
  .then(account => {
    console.log('Successfully connected to Twilio using API Key!');
    console.log('Account Name:', account.friendlyName);
  })
  .catch(err => {
    console.error('❌ Twilio API Key Connection Failed:', err.message);
  });
