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
        },
      },
      select: {
        tID: true,
        title: true,
        tags: {
          select: {
            value: true
          }
        }
      },
      take: 5,
    });

    res.status(200).json(templates);
  } catch (error) {
    // If the database doesn't support insensitive search (SQLite), try alternative approach
    if (error instanceof Error && error.message.includes('insensitive')) {
      try {
        const search = String(req.query.search || '').toLowerCase();
        
        const templates = await prisma.template.findMany({
          where: {
            title: {
              contains: search,
            },
          },
          select: {
            tID: true,
            title: true,
            tags: {
              select: {
                value: true
              }
            }
          },
          take: 5,
        });

        // Manual case-insensitive filtering
        const filteredTemplates = templates.filter(template => 
          template.title.toLowerCase().includes(search)
        );

        res.status(200).json(filteredTemplates);
      } catch (fallbackError) {
        console.error('Template search fallback error:', fallbackError);
        res.status(500).json({ error: 'Failed to search templates' });
      }
    } else {
      console.error('Template search error:', error);
      res.status(500).json({ error: 'Failed to search templates' });
    }
  }
} 