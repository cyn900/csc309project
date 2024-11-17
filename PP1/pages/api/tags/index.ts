import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/utils/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: {
          value: 'asc'
        }
      });
      res.status(200).json(tags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      res.status(500).json({ message: 'Failed to fetch tags' });
    }
  } 
  else if (req.method === 'POST') {
    const { value } = req.body;

    if (!value || typeof value !== 'string') {
      return res.status(400).json({ message: 'Tag value is required' });
    }

    try {
      // Try to find existing tag
      const existingTag = await prisma.tag.findUnique({
        where: { value: value.toLowerCase() }
      });

      if (existingTag) {
        return res.status(409).json(existingTag);
      }

      // Create new tag if it doesn't exist
      const newTag = await prisma.tag.create({
        data: { value: value.toLowerCase() }
      });

      res.status(201).json(newTag);
    } catch (error) {
      console.error('Failed to create tag:', error);
      res.status(500).json({ message: 'Failed to create tag' });
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 