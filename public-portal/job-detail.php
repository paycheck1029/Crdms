<?php
require_once 'config.php';

$job_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$job = null;

if ($job_id > 0) {
    try {
        $stmt = $pdo->prepare("SELECT j.*, u.username as creator_name FROM Jobs j JOIN Users u ON j.created_by = u.id WHERE j.id = ? AND j.status = 'Active'");
        $stmt->execute([$job_id]);
        $job = $stmt->fetch();
    } catch (Exception $e) {
        $job = null;
    }
}

if (!$job) {
    header("HTTP/1.1 404 Not Found");
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Job Not Found | Paycheck Alpha</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { background: #090e1a; color: #f3f4f6; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; margin: 0; }
            h1 { font-size: 2rem; margin-bottom: 1rem; color: #60a5fa; }
            p { color: #9ca3af; margin-bottom: 2rem; }
            .btn { background: #3b82f6; color: #fff; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; transition: background 0.2s; }
            .btn:hover { background: #2563eb; }
        </style>
    </head>
    <body>
        <h1>Job Posting Not Found</h1>
        <p>The job listing you are looking for has expired, been removed, or does not exist.</p>
        <a href="/" class="btn">View All Openings</a>
    </body>
    </html>
    <?php
    exit;
}

// Clean fields for SEO title and meta descriptions
$seo_title = htmlspecialchars($job['title']) . " Job Opening in " . htmlspecialchars($job['location']) . " | Paycheck Alpha";
$short_desc = strip_tags($job['description']);
$seo_desc = htmlspecialchars(substr($short_desc, 0, 160)) . (strlen($short_desc) > 160 ? '...' : '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $seo_title; ?></title>
    <meta name="description" content="<?php echo $seo_desc; ?>">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090e1a;
            --surface: rgba(17, 24, 39, 0.7);
            --border: rgba(255, 255, 255, 0.08);
            --accent: #3b82f6;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
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
            line-height: 1.6;
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
            max-width: 800px;
            margin: 0 auto;
            padding: 0 1.5rem;
            width: 100%;
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

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.875rem;
            margin-top: 2.5rem;
            margin-bottom: 1.5rem;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #60a5fa;
        }

        .job-detail-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2.5rem;
            margin-bottom: 5rem;
            backdrop-filter: blur(8px);
        }

        h1 {
            font-size: 2.25rem;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin-bottom: 1rem;
            color: #ffffff;
        }

        .job-meta {
            display: flex;
            gap: 1.5rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border);
            flex-wrap: wrap;
        }

        .job-meta-item {
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .job-meta-item svg {
            color: var(--accent);
        }

        .section-title {
            font-size: 1.15rem;
            font-weight: 700;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            color: #60a5fa;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .content-box {
            font-size: 0.975rem;
            color: #d1d5db;
            white-space: pre-line;
            line-height: 1.7;
        }

        .apply-box {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
            text-align: center;
        }

        .btn-apply {
            display: inline-block;
            background: var(--accent);
            color: #ffffff;
            text-decoration: none;
            padding: 0.85rem 2rem;
            border-radius: 8px;
            font-weight: 700;
            font-size: 1rem;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
            transition: all 0.2s;
        }

        .btn-apply:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }

        footer {
            margin-top: auto;
            border-top: 1px solid var(--border);
            padding: 2.5rem 0;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
    </style>

    <!-- Schema.org JSON-LD Structured Metadata for Google Search Engine Crawlers -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": <?php echo json_encode($job['title']); ?>,
      "description": <?php echo json_encode($job['description'] . "\n\nRequirements:\n" . $job['requirements']); ?>,
      "datePosted": <?php echo json_encode(date('c', strtotime($job['created_at']))); ?>,
      "validThrough": <?php echo json_encode(date('c', strtotime($job['created_at'] . ' + 180 days'))); ?>,
      "employmentType": "FULL_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "Paycheck Alpha",
        "sameAs": "https://paycheckalpha.com"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": <?php echo json_encode($job['location']); ?>,
          "addressCountry": "IN"
        }
      },
      <?php if (!empty($job['salary_range'])): ?>
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": {
          "@type": "QuantitativeValue",
          "value": <?php echo json_encode($job['salary_range']); ?>,
          "unitText": "MONTH"
        }
      },
      <?php endif; ?>
      "identifier": {
        "@type": "PropertyValue",
        "name": "Paycheck Alpha",
        "value": <?php echo json_encode($job['id']); ?>
      }
    }
    </script>
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
        <a href="/" class="back-link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="m15 18-6-6 6-6"/>
            </svg>
            <span>Back to Job List</span>
        </a>

        <article class="job-detail-card">
            <h1><?php echo htmlspecialchars($job['title']); ?></h1>
            
            <div class="job-meta">
                <div class="job-meta-item">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span><?php echo htmlspecialchars($job['location']); ?></span>
                </div>
                <?php if (!empty($job['salary_range'])): ?>
                    <div class="job-meta-item">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" x2="12" y1="2" y2="22"/>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        <span><?php echo htmlspecialchars($job['salary_range']); ?></span>
                    </div>
                <?php endif; ?>
                <div class="job-meta-item">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8" x2="8" y1="2" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                    <span>Posted on <?php echo date('F d, Y', strtotime($job['created_at'])); ?></span>
                </div>
            </div>

            <h2 class="section-title">Job Description</h2>
            <div class="content-box"><?php echo htmlspecialchars($job['description']); ?></div>

            <?php if (!empty($job['requirements'])): ?>
                <h2 class="section-title">Requirements</h2>
                <div class="content-box"><?php echo htmlspecialchars($job['requirements']); ?></div>
            <?php endif; ?>

            <div class="apply-box">
                <a href="mailto:careers@paycheckalpha.com?subject=Application for <?php echo rawurlencode($job['title']); ?> (ID: <?php echo $job['id']; ?>)" class="btn-apply">
                    Apply For This Job
                </a>
            </div>
        </article>
    </main>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> Paycheck Alpha. All Rights Reserved. Recruiter Database Management Portal.</p>
        </div>
    </footer>
</body>
</html>
