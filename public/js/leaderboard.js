document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('leaderboardContainer');
  
  try {
    const res = await fetch('/api/v1/auth/leaderboard');
    const json = await res.json();
    
    if (!json.success) throw new Error();

    if (json.data.length === 0) {
      container.innerHTML = `<p style="color: white; text-align: center; font-size: 20px;">Belum ada member aktif.</p>`;
      return;
    }

    let html = '';
    json.data.forEach((user, index) => {
      const rank = index + 1;
      let rankClass = '';
      let rankTrophy = `#${rank}`;
      
      if (rank === 1) { rankClass = 'rank-1'; rankTrophy = '🏆 #1'; }
      else if (rank === 2) { rankClass = 'rank-2'; rankTrophy = '🥈 #2'; }
      else if (rank === 3) { rankClass = 'rank-3'; rankTrophy = '🥉 #3'; }

      html += `
        <div class="rank-item ${rankClass}">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 24px; width: 60px;">${rankTrophy}</div>
            <div>
              <span style="font-size: 20px;">${user.full_name}</span>
              <span class="badge badge-yellow" style="margin-left: 12px; font-size: 12px; border-width: 2px;">🔥 ${user.streak_days || 0} Streak</span>
            </div>
          </div>
          <div style="font-size: 24px;">
            ${user.points || 0} PTS
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color: red; background: white; padding: 16px; border: 4px solid black; font-weight: bold; text-align: center;">Gagal memuat papan peringkat.</p>`;
  }
});
