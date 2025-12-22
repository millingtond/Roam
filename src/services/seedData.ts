import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

// Dynamic asset loading - add your tour files here
// For each stop, add an audio and optional image entry
const TOUR_ASSETS = {
  config: require('../../assets/tour.json'),
  files: [
    // Stop 1
    { name: '01-stop.mp3', asset: require('../../assets/01-stop.mp3') },
    { name: '01-stop.jpg', asset: require('../../assets/01-stop.jpg') },
    // Stop 2 - uncomment and add files to assets folder
    // { name: '02-stop.mp3', asset: require('../../assets/02-stop.mp3') },
    // { name: '02-stop.jpg', asset: require('../../assets/02-stop.jpg') },
    // Stop 3
    // { name: '03-stop.mp3', asset: require('../../assets/03-stop.mp3') },
    // { name: '03-stop.jpg', asset: require('../../assets/03-stop.jpg') },
    // Continue for all stops...
  ]
};

// Alternative: If you have many stops, create a helper
function generateAssetList(stopCount: number) {
  const files: Array<{ name: string; asset: any }> = [];
  // Note: require() must be static, so this is just documentation
  // You must manually add each require() statement above
  return files;
}

const DOC_DIR = FileSystem.documentDirectory?.startsWith('file://') 
  ? FileSystem.documentDirectory 
  : `file://${FileSystem.documentDirectory}`;

const TOURS_DIR = DOC_DIR + 'tours/';

export async function seedSampleTour() {
  try {
    console.log('📦 SEEDING REAL TOUR...');

    // Load the JSON to get the ID
    const tourAsset = Asset.fromModule(TOUR_ASSETS.config);
    await tourAsset.downloadAsync();
    const tourContent = await FileSystem.readAsStringAsync(tourAsset.localUri || tourAsset.uri);
    const tourData = JSON.parse(tourContent);
    const tourId = tourData.id;

    // Define Paths
    const tourDir = TOURS_DIR + tourId + '/';
    const audioDir = tourDir + 'audio/';
    const imagesDir = tourDir + 'images/';

    // Create Directories
    await FileSystem.makeDirectoryAsync(tourDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });

    // Write tour.json
    await FileSystem.writeAsStringAsync(tourDir + 'tour.json', tourContent);

    // Copy all files
    for (const file of TOUR_ASSETS.files) {
      console.log(`Processing ${file.name}...`);
      const asset = Asset.fromModule(file.asset);
      await asset.downloadAsync();

      // Determine where it goes based on extension
      const isImage = file.name.endsWith('.jpg') || file.name.endsWith('.png');
      const destFolder = isImage ? imagesDir : audioDir;
      
      await FileSystem.copyAsync({
        from: asset.localUri || asset.uri,
        to: destFolder + file.name
      });
    }

    console.log(`✅ INSTALLED TOUR: ${tourData.name}`);
    return true;

  } catch (error) {
    console.error('❌ INSTALL FAILED:', error);
    return false;
  }
}
