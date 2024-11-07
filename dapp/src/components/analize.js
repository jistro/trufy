import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Expected maximum values for each profile type
const profileCriteria = {
  DEVELOPER: {
    activity_score: 20,
    identity_score: 60,
    nominations_received_count: 100,
    passport_id: 2000,
    bio: 10,
    tags: 10,
    follower_count_passport_socials: 20,
    following_count_passport_socials: 10,
    follower_count_farcaster: 100,
    following_count_farcaster: 50,
    score: 150,
    skills_score: 75,
    verified_wallets: 10,
  },
  DESIGNER: {
    activity_score: 15,
    identity_score: 40,
    nominations_received_count: 10,
    passport_id: 2500,
    bio: 10,
    tags: 10,
    follower_count_passport_socials: 20,
    following_count_passport_socials: 20,
    follower_count_farcaster: 250,
    following_count_farcaster: 250,
    score: 75,
    skills_score: 30,
    verified_wallets: 3,
  },
  'COMMUNITY MANAGER': {
    activity_score: 25,
    identity_score: 100,
    nominations_received_count: 25,
    passport_id: 1500,
    bio: 10,
    tags: 10,
    follower_count_passport_socials: 150,
    following_count_passport_socials: 150,
    follower_count_farcaster: 750,
    following_count_farcaster: 1000,
    score: 75,
    skills_score: 20,
    verified_wallets: 3,
  },
  MARKETING: {
    activity_score: 30,
    identity_score: 100,
    nominations_received_count: 25,
    passport_id: 2000,
    bio: 10,
    tags: 10,
    follower_count_passport_socials: 100,
    following_count_passport_socials: 100,
    follower_count_farcaster: 500,
    following_count_farcaster: 500,
    score: 75,
    skills_score: 25,
    verified_wallets: 3,
  },
};

export default async (req, res) => {
  try {
    const { profileType, jsonData } = req.body;

    if (!profileType || !jsonData) {
      return res.status(400).json({ error: 'Profile type and JSON data are required.' });
    }

    const criteria = profileCriteria[profileType.toUpperCase()];
    if (!criteria) {
      return res.status(400).json({ error: 'Invalid profile type.' });
    }

    const scores = {};

    // Helper function to normalize scores
    const normalize = (value, max) => {
      const normalized = Math.min(value / max, 1);
      return normalized;
    };

    const passport = jsonData.passport;

    // Numeric attributes
    scores.activity_score = normalize(passport.activity_score, criteria.activity_score);
    scores.identity_score = normalize(passport.identity_score, criteria.identity_score);
    scores.nominations_received_count = normalize(
      passport.nominations_received_count,
      criteria.nominations_received_count
    );
    scores.passport_id = normalize(criteria.passport_id - passport.passport_id, criteria.passport_id - 1000);

    scores.score = normalize(passport.score, criteria.score);
    scores.skills_score = normalize(passport.skills_score, criteria.skills_score);
    scores.verified_wallets = normalize(passport.verified_wallets.length, criteria.verified_wallets);

    // Analyze bio
    const bioScore = await analyzeText(passport.passport_profile.bio, profileType);
    scores.bio = bioScore / criteria.bio;

    // Analyze tags
    const tagsText = passport.passport_profile.tags.join(', ');
    const tagsScore = await analyzeText(tagsText, profileType);
    scores.tags = tagsScore / criteria.tags;

    // Socials
    let followerCountPassportSocials = 0;
    let followingCountPassportSocials = 0;
    let followerCountFarcaster = 0;
    let followingCountFarcaster = 0;

    for (const social of passport.passport_socials) {
      if (social.source === 'farcaster') {
        followerCountFarcaster += social.follower_count || 0;
        followingCountFarcaster += social.following_count || 0;
      } else {
        followerCountPassportSocials += social.follower_count || 0;
        followingCountPassportSocials += social.following_count || 0;
      }
    }

    scores.follower_count_passport_socials = normalize(
      followerCountPassportSocials,
      criteria.follower_count_passport_socials
    );
    scores.following_count_passport_socials = normalize(
      followingCountPassportSocials,
      criteria.following_count_passport_socials
    );
    scores.follower_count_farcaster = normalize(
      followerCountFarcaster,
      criteria.follower_count_farcaster
    );
    scores.following_count_farcaster = normalize(
      followingCountFarcaster,
      criteria.following_count_farcaster
    );

    // Combine scores (you can adjust weights as needed)
    const totalScore =
      (scores.activity_score +
        scores.identity_score +
        scores.nominations_received_count +
        scores.passport_id +
        scores.bio +
        scores.tags +
        scores.follower_count_passport_socials +
        scores.following_count_passport_socials +
        scores.follower_count_farcaster +
        scores.following_count_farcaster +
        scores.score +
        scores.skills_score +
        scores.verified_wallets) /
      13;

    // Scale total score to range between 0.1 and 1
    const factor = Math.max(0.1, Math.min(totalScore, 1));

    res.status(200).json({ factor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Function to analyze text relevance using OpenAI API
async function analyzeText(text, profileType) {
  if (!text) return 0;

  const prompt = `On a scale of 1 to 10, how relevant is the following text to the profession "${profileType}"? Only provide the number:\n\n"${text}"`;

  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 1,
      temperature: 0,
    });

    const score = parseInt(response.data.choices[0].text.trim(), 10);
    return isNaN(score) ? 0 : score;
  } catch (error) {
    console.error('Error analyzing text:', error);
    return 0;
  }
}
