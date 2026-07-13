document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('leaderboardContainer');
  
  try {
    const res = await fetch('/api/v1/auth/leaderboard');
    const json = await res.json();
    
    if (!json.success) throw new Error();

    if (json.data.length === 0) {
      container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--udemy-gray-text);">No active members yet.</td></tr>`;
      return;
    }

    let html = '';
    json.data.forEach((user, index) => {
      const rank = index + 1;
      let rankClass = '';
      let rankTrophy = `#${rank}`;
      
      if (rank === 1) { rankClass = 'rank-1'; rankTrophy = '<span class="trophy">🏆</span> #1'; }
      else if (rank === 2) { rankClass = 'rank-2'; rankTrophy = '<span class="trophy">🥈</span> #2'; }
      else if (rank === 3) { rankClass = 'rank-3'; rankTrophy = '<span class="trophy">🥉</span> #3'; }

      html += `
        <tr class="${rankClass}">
          <td style="font-weight: 700;">${rankTrophy}</td>
          <td>
            <div style="font-weight: 700; color: var(--udemy-dark);">${user.full_name}</div>
          </td>
          <td>🔥 ${user.streak_days || 0}</td>
          <td style="text-align: right; font-weight: 700;">${user.points || 0}</td>
        </tr>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Failed to load leaderboard.</td></tr>`;
  }
});
