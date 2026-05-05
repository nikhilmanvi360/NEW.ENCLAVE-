export type Verdict = 'True' | 'False' | 'Partially True' | 'Insufficient Evidence';

export interface FactCheckResponse {
  verdict: Verdict;
  confidence: number;
  short_reason: string;
  key_points: string[];
}

export async function verifyClaim(claim: string): Promise<FactCheckResponse> {
  // Replace this with your actual backend URL
  // e.g., 'http://localhost:3000/api/verify' or 'https://api.yourdomain.com/verify'
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/verify';

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST', // Adjust based on your backend logic
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer YOUR_OPTIONAL_TOKEN`
      },
      body: JSON.stringify({ claim }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Mapping your backend's response to our UI's expected 'FactCheckResponse' format
    // Modify this if your backend returns data in a slightly different structure.
    return {
      verdict: data.verdict,
      confidence: data.confidence,
      short_reason: data.short_reason,
      key_points: data.key_points || []
    } as FactCheckResponse;

  } catch (err: any) {
    console.error('Fact-check fetch error:', err);
    throw new Error('Failed to connect to the fact-checking server. Make sure your backend is running.');
  }
}

