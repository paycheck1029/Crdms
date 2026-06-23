import { query, queryGet } from '../database/connection.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const getReports = async (req, res, next) => {
  try {
    // 1. Core KPIs counts
    const totalCandidatesResult = await queryGet('SELECT COUNT(*) as count FROM Candidates WHERE deleted_at IS NULL');
    const totalCandidates = totalCandidatesResult ? totalCandidatesResult.count : 0;

    // Today's Interviews scheduled
    const todaysInterviewsResult = await queryGet(`
      SELECT COUNT(DISTINCT candidate_id) as count 
      FROM CandidateTimeline 
      WHERE event = 'Interview Scheduled' AND DATE(timestamp) = CURDATE()
    `);
    const todaysInterviews = todaysInterviewsResult ? todaysInterviewsResult.count : 0;

    // Status categories counts
    const statusCounts = await query('SELECT status, COUNT(*) as count FROM Candidates WHERE deleted_at IS NULL GROUP BY status');
    
    const getCountByStatus = (statusList) => {
      return statusCounts
        .filter(s => statusList.includes(s.status))
        .reduce((sum, item) => sum + item.count, 0);
    };

    const pending = getCountByStatus(['Applied', 'Screening', 'Pending']);
    const selected = getCountByStatus(['Selected', 'Offered']);
    const rejected = getCountByStatus(['Rejected']);
    const offers = getCountByStatus(['Offered']);
    const joining = getCountByStatus(['Joining', 'Hired']);

    // 2. Geographic & Skills Spread
    const locationCounts = await query(`
      SELECT location, COUNT(*) as count 
      FROM Candidates 
      WHERE deleted_at IS NULL 
      GROUP BY location 
      ORDER BY count DESC 
      LIMIT 8
    `);

    const expStats = await queryGet(`
      SELECT AVG(experience_years) as avgExp, MIN(experience_years) as minExp, MAX(experience_years) as maxExp 
      FROM Candidates 
      WHERE deleted_at IS NULL
    `);

    // Top skills analysis
    const candidates = await query('SELECT skills FROM Candidates WHERE deleted_at IS NULL');
    const skillsMap = {};
    candidates.forEach(c => {
      if (c.skills) {
        c.skills.split(',').forEach(skill => {
          const trimmed = skill.trim().toLowerCase();
          if (trimmed) {
            skillsMap[trimmed] = (skillsMap[trimmed] || 0) + 1;
          }
        });
      }
    });

    const topSkills = Object.entries(skillsMap)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. Chronological Charts (Weekly, Monthly, Yearly registration trends)
    const weeklyTrends = await query(`
      SELECT YEARWEEK(created_at, 1) as period, COUNT(*) as count 
      FROM Candidates 
      WHERE deleted_at IS NULL 
      GROUP BY period 
      ORDER BY period DESC 
      LIMIT 12
    `);

    const monthlyTrends = await query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as period, COUNT(*) as count 
      FROM Candidates 
      WHERE deleted_at IS NULL 
      GROUP BY period 
      ORDER BY period DESC 
      LIMIT 12
    `);

    const yearlyTrends = await query(`
      SELECT DATE_FORMAT(created_at, '%Y') as period, COUNT(*) as count 
      FROM Candidates 
      WHERE deleted_at IS NULL 
      GROUP BY period 
      ORDER BY period DESC 
      LIMIT 5
    `);

    return sendSuccess(res, {
      kpi: {
        totalCandidates,
        todaysInterviews,
        pending,
        selected,
        rejected,
        offers,
        joining
      },
      statusCounts,
      locationCounts,
      experienceStats: {
        avgExperience: Math.round((expStats.avgExp || 0) * 10) / 10,
        minExperience: expStats.minExp || 0,
        maxExperience: expStats.maxExp || 0
      },
      topSkills,
      trends: {
        weekly: weeklyTrends.reverse(),
        monthly: monthlyTrends.reverse(),
        yearly: yearlyTrends.reverse()
      }
    }, 'Analytical reports compiled successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getReports
};
