import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { repo_name, description, files } = await req.json();

        if (!repo_name || !files || !Array.isArray(files)) {
            return Response.json({ error: 'Missing required fields: repo_name, files' }, { status: 400 });
        }

        const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
        const headers = {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
        };

        // Get authenticated user info
        const userRes = await fetch('https://api.github.com/user', { headers });
        if (!userRes.ok) {
            const err = await userRes.json();
            return Response.json({ error: 'GitHub auth failed', details: err }, { status: 401 });
        }
        const githubUser = await userRes.json();
        const owner = githubUser.login;

        // Create repo
        const createRepoRes = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: repo_name,
                description: description || 'SportHub app',
                private: false,
                auto_init: false,
            }),
        });

        let repoData;
        if (createRepoRes.status === 422) {
            // Repo already exists, that's fine
            const getRepoRes = await fetch(`https://api.github.com/repos/${owner}/${repo_name}`, { headers });
            repoData = await getRepoRes.json();
        } else if (!createRepoRes.ok) {
            const err = await createRepoRes.json();
            return Response.json({ error: 'Failed to create repo', details: err }, { status: 500 });
        } else {
            repoData = await createRepoRes.json();
        }

        // Push files one by one
        const pushed = [];
        const failed = [];

        for (const file of files) {
            const { path, content } = file;
            if (!path || content === undefined) continue;

            const encoded = btoa(unescape(encodeURIComponent(content)));

            // Check if file exists (to get SHA for update)
            let sha = null;
            const existingRes = await fetch(`https://api.github.com/repos/${owner}/${repo_name}/contents/${path}`, { headers });
            if (existingRes.ok) {
                const existing = await existingRes.json();
                sha = existing.sha;
            }

            const body = {
                message: sha ? `Update ${path}` : `Add ${path}`,
                content: encoded,
            };
            if (sha) body.sha = sha;

            const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo_name}/contents/${path}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body),
            });

            if (fileRes.ok) {
                pushed.push(path);
            } else {
                const err = await fileRes.json();
                failed.push({ path, error: err });
            }
        }

        return Response.json({
            success: true,
            repo_url: repoData.html_url,
            owner,
            pushed_count: pushed.length,
            failed_count: failed.length,
            pushed,
            failed,
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});