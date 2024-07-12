import { parse, isValid, isAfter } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (req.method === 'POST') {
    const { startDate, endDate } = req.body;

    const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
    const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());

    if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (isAfter(parsedStartDate, parsedEndDate)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Here you can add any additional logic, like fetching data for the selected date range

    return res.status(200).json({ startDate: parsedStartDate, endDate: parsedEndDate });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
