const { onCall } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
// Do NOT initialize clients here yet
const textToSpeech = require('@google-cloud/text-to-speech');

admin.initializeApp();
const bucket = admin.storage().bucket();

exports.generateAudio = onCall(
  { 
    timeoutSeconds: 300, 
    memory: "1GiB" 
  }, 
  async (request) => {
    // Initialize the client INSIDE the function
    const ttsClient = new textToSpeech.TextToSpeechClient();

    const { tourId, stops, voice = 'en-GB-Wavenet-A' } = request.data;
    const results = [];
    
    for (const stop of stops) {
      if (!stop.script) continue;
      
      const [response] = await ttsClient.synthesizeSpeech({
        input: { text: stop.script },
        voice: { 
          languageCode: voice.substring(0, 5), 
          name: voice 
        },
        audioConfig: { audioEncoding: 'MP3' },
      });
      
      const filename = `tours/${tourId}/audio/${String(stop.id).padStart(2, '0')}-stop.mp3`;
      const file = bucket.file(filename);
      
      await file.save(response.audioContent, {
        contentType: 'audio/mpeg',
      });
      
      results.push({ stopId: stop.id, filename });
    }
    
    return { success: true, files: results };
  }
);