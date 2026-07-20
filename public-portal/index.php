<?php
require_once 'config.php';

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'job-opening' : $text;
}

try {
    $stmt = $pdo->prepare("SELECT j.*, u.username as company_name FROM Jobs j JOIN Users u ON j.created_by = u.id WHERE j.status = 'Active' ORDER BY j.created_at DESC");
    $stmt->execute();
    $jobs = $stmt->fetchAll();
} catch (Exception $e) {
    $jobs = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Openings | Paycheck Alpha Career Portal</title>
    <meta name="description" content="Explore exciting job opportunities at Paycheck Alpha. Find your next career move and apply online today.">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090e1a;
            --surface: rgba(17, 24, 39, 0.7);
            --surface-hover: rgba(31, 41, 55, 0.8);
            --border: rgba(255, 255, 255, 0.08);
            --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.3);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --success: #10b981;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            line-height: 1.5;
        }

        header {
            border-bottom: 1px solid var(--border);
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(9, 14, 26, 0.8);
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 70px;
        }

        .logo {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--text-primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .logo span {
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero {
            padding: 5rem 0 3rem;
            text-align: center;
        }

        .hero h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            letter-spacing: -0.025em;
            background: linear-gradient(135deg, #ffffff 0%, #9ca3af 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero p {
            color: var(--text-secondary);
            font-size: 1.15rem;
            max-width: 600px;
            margin: 0 auto;
        }

        .jobs-section {
            margin-bottom: 5rem;
        }

        .jobs-list {
            display: grid;
            gap: 1.25rem;
        }

        .job-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2rem;
            text-decoration: none;
            color: inherit;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .job-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--accent);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .job-card:hover {
            background: var(--surface-hover);
            border-color: rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px var(--accent-glow);
        }

        .job-card:hover::before {
            opacity: 1;
        }

        .job-info h2 {
            font-size: 1.35rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            transition: color 0.2s;
        }

        .job-card:hover .job-info h2 {
            color: #60a5fa;
        }

        .job-meta {
            display: flex;
            gap: 1.5rem;
            font-size: 0.85rem;
            color: var(--text-secondary);
            flex-wrap: wrap;
        }

        .job-meta-item {
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .job-meta-item svg {
            color: var(--accent);
            flex-shrink: 0;
        }

        .btn-view {
            background: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.2);
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.2s;
        }

        .job-card:hover .btn-view {
            background: var(--accent);
            color: #ffffff;
            border-color: var(--accent);
        }

        footer {
            margin-top: auto;
            border-top: 1px solid var(--border);
            padding: 2.5rem 0;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        @media (max-width: 768px) {
            .job-card {
                flex-direction: column;
                align-items: flex-start;
                gap: 1.5rem;
                padding: 1.5rem;
            }
            .btn-view {
                width: 100%;
                text-align: center;
            }
            .hero h1 {
                font-size: 2.25rem;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container header-content">
            <a href="/" class="logo">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
                    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                <span>Paycheck Alpha</span>
            </a>
        </div>
    </header>

    <main class="container">
        <section class="hero">
            <h1>Find Your Dream Career</h1>
            <p>Join our team of builders and innovators to craft the next generation of recruitment intelligence solutions.</p>
        </section>

        <section class="jobs-section">
            <div class="jobs-list">
                <?php if (empty($jobs)): ?>
                    <div class="glass-card" style="text-align: center; padding: 4rem 2rem; background: var(--surface); border: 1px solid var(--border); border-radius: 12px;">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-secondary); margin-bottom: 1rem;">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8v4M12 16h.01"/>
                        </svg>
                        <p style="color: var(--text-secondary);">No job vacancies are currently open. Please check back later!</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($jobs as $job): 
                        $slug = slugify($job['title']);
                        $detail_url = "/jobs/" . $job['id'] . "-" . $slug;
                    ?>
                        <a href="<?php echo htmlspecialchars($detail_url); ?>" class="job-card">
                            <div class="job-info">
                                <h2><?php echo htmlspecialchars($job['title']); ?></h2>
                                <div class="job-meta">
                                    <div class="job-meta-item">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        <span><?php echo htmlspecialchars($job['location']); ?></span>
                                    </div>
                                    <?php if (!empty($job['salary_range'])): ?>
                                        <div class="job-meta-item">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="12" x2="12" y1="2" y2="22"/>
                                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                            </svg>
                                            <span><?php echo htmlspecialchars($job['salary_range']); ?></span>
                                        </div>
                                    <?php endif; ?>
                                    <div class="job-meta-item">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                                            <line x1="16" x2="16" y1="2" y2="6"/>
                                            <line x1="8" x2="8" y1="2" y2="6"/>
                                            <line x1="3" x2="21" y1="10" y2="10"/>
                                        </svg>
                                        <span>Posted on <?php echo date('M d, Y', strtotime($job['created_at'])); ?></span>
                                    </div>
                                </div>
                            </div>
                            <div class="btn-view">View Details</div>
                        </a>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> Paycheck Alpha. All Rights Reserved. Recruiter Database Management Portal.</p>
        </div>
    </footer>
</body>
</html>
