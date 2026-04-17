require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken ? 'Present' : 'Missing');

const client = twilio(accountSid, authToken);

client.api.accounts(accountSid)
  .fetch()
  .then(account => {
    console.log('Successfully connected to Twilio!');
    console.log('Account Name:', account.friendlyName);
    console.log('Status:', account.status);
  })
  .catch(err => {
    console.error('❌ Twilio Connection Failed:', err.message);
    if (err.code === 20003) {
      console.error('Error 20003: Authenticate. This usually means the Account SID or Auth Token is incorrect.');
    }
  });
