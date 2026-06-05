export type SkinAnalysisResult = {
  acne: number;
  wrinkles: number;
  darkCircles: number;
  skinAge: number;
  skinType?: number;
};

export const sendForAnalysis = async (imageBase64: string): Promise<SkinAnalysisResult> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Analysis failed. Try another selfie.');
  }

  return await response.json();
};
