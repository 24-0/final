import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Placeholder moderation logic: always allow
    res.status(200).json({ flagged: false });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
