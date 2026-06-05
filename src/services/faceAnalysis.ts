export type FaceAnalysisResult = {
  acne: number;
  wrinkles: number;
  darkCircles: number;
  skinAge: number;
  skinType: number;
};

export const analyzeFace = async (imageBase64: string): Promise<FaceAnalysisResult> => {
  const apiKey = process.env.FACE_API_KEY;
  const apiSecret = process.env.FACE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('FACE_API_KEY and FACE_API_SECRET environment variables are missing');
  }

  // Ensure leading data:image prefix is removed
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const formData = new URLSearchParams();
  formData.append('api_key', apiKey);
  formData.append('api_secret', apiSecret);
  formData.append('image_base64', base64Data);

  const response = await fetch('https://api-us.faceplusplus.com/facepp/v1/skinanalyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Face++ API Response Error:', errorBody);
    throw new Error(`Face++ API Request failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data?.result) {
    console.error('Unexpected Face++ API Format:', data);
    throw new Error('Analysis failed to return expected result format');
  }

  const result = data.result;

  return {
    acne: result.acne?.value || 0,
    wrinkles: result.wrinkle?.value || 0,
    darkCircles: result.dark_circle?.value || 0,
    skinAge: result.skin_age?.value || 0,
    skinType: result.skin_type?.skin_type || 0,
  };
};
