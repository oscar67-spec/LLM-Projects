export type FaceAnalysisResult = {
  acne: number;
  wrinkles: number;
  darkCircles: number;
  skinAge: number;
  skinType: number;
};

// Helper to convert Face++ confidence + value into a severity score (0-100)
// Face++ gives a predicted value (0 = absent, 1 = present) and a confidence in that prediction.
// If absent, high confidence means score -> 0, low confidence means score -> 50.
// If present, high confidence means score -> 100, low confidence means score -> 50.
function getSeverityScore(trait: { value?: number; confidence?: number } | undefined): number {
  if (!trait || typeof trait.value !== 'number' || typeof trait.confidence !== 'number') return 0;
  if (trait.value > 0) {
    return Math.round(50 + trait.confidence * 50);
  } else {
    return Math.round(50 - trait.confidence * 50);
  }
}

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

  // Compute individual scores based on corresponding Face++ metrics
  const acneScore = Math.max(
    getSeverityScore(result.acne),
    getSeverityScore(result.blackhead)
  );

  const darkCirclesScore = getSeverityScore(result.dark_circle);

  // Compute wrinkle score as average of all wrinkle types
  const wrinkleMetrics = [
    getSeverityScore(result.glabella_wrinkle),
    getSeverityScore(result.nasolabial_fold),
    getSeverityScore(result.forehead_wrinkle),
    getSeverityScore(result.crows_feet),
    getSeverityScore(result.eye_finelines)
  ];
  const avgWrinkle = Math.round(wrinkleMetrics.reduce((a, b) => a + b, 0) / wrinkleMetrics.length);

  // Since Face++ skinanalyze doesn't natively return age, compute an estimated skin age structurally 
  // derived from the actual physical traits evaluated.
  const estimatedSkinAge = Math.round(20 + (avgWrinkle * 0.35) + (darkCirclesScore * 0.15) + (acneScore * 0.05));

  return {
    acne: acneScore,
    wrinkles: avgWrinkle,
    darkCircles: darkCirclesScore,
    skinAge: estimatedSkinAge,
    skinType: result.skin_type?.skin_type || 0,
  };
};
