import type { NextApiRequest, NextApiResponse } from 'next';

const signoutHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    // Here you could add any necessary cleanup
    // For example, if you're using server-side sessions:
    // req.session.destroy();

    // If you're using JWT and want to invalidate it, you'd typically do that client-side
    // by removing the token from storage. There's no need to do anything server-side for JWTs.

    res.status(200).json({ message: 'Sign out successful' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Sign out failed' });
  }
};

export default signoutHandler;