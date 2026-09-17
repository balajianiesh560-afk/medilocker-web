import { generateAndDownloadSIHPptx, defaultPptConfig } from '../src/utils/generatePptx';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Generating PPTX presentation...');
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const targetPath = path.join(publicDir, 'SIH26047_MediKiosk_PitchDeck.pptx');
  
  // Call generator
  await generateAndDownloadSIHPptx({
    ...defaultPptConfig,
    teamId: '92770',
    teamName: '404 The Optimists',
    prototypeUrl: 'https://ais-dev-bry5wph3sp4uvumwidzmwx-824539073282.asia-east1.run.app',
  });

  const generatedFile = `SIH26047_MediKiosk_404_The_Optimists_PitchDeck.pptx`;
  if (fs.existsSync(generatedFile)) {
    fs.copyFileSync(generatedFile, targetPath);
    console.log(`Copied ${generatedFile} to ${targetPath}`);
    // Also copy to dist if dist exists
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(generatedFile, path.join(distDir, 'SIH26047_MediKiosk_PitchDeck.pptx'));
    }
  }

  console.log('PPTX generation finished successfully!');
}

main().catch((err) => {
  console.error('Error generating PPTX:', err);
  process.exit(1);
});
