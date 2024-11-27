import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/utils/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const search = String(req.query.search || '');
    
    const templates = await prisma.template.findMany({
      where: {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      select: {
        tID: true,
        title: true,
      },
      take: 5,
    });

    res.status(200).json(templates);
  } catch (error) {
    console.error('Template search error:', error);
    res.status(500).json({ error: 'Failed to search templates' });
  }
} 