import fetch from 'node-fetch';

async function test() {
  const payload = {
    inviteToken: 'v4i3f15q2c5', // Wait, what is the token for hola@algoritmot.com?
    accessCode: 'A1B2C3D4', // What is the access code?
    survey: {
      answers: { "1": 5, "2": 5, "3": 5, "4": 5, "5": 5 },
      submittedAt: new Date().toISOString(),
      average: 5
    }
  };
  
  // I don't have the token/code. I will just query it from DB.
}
