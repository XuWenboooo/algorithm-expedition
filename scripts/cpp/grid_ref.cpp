// 网格 DFS/BFS 参考：R C + R 行网格 + 模式(DFS/BFS) → 访问格子数
#include <bits/stdc++.h>
using namespace std;
int main() {
    int R, C;
    cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    string mode; cin >> mode;
    int sr = -1, sc = -1;
    for (int r = 0; r < R && sr < 0; r++)
        for (int c = 0; c < C; c++)
            if (g[r][c] == 'o') { sr = r; sc = c; g[r][c] = '.'; break; }
    int visited = 0;
    if (mode == "DFS") {
        // 显式栈（避免大网格爆递归）
        stack<pair<int,int>> st;
        st.push({sr, sc});
        g[sr][sc] = 'x';
        visited++;
        const int dr[] = {-1,1,0,0}, dc[] = {0,0,-1,1};
        while (!st.empty()) {
            auto [r, c] = st.top(); st.pop();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                if (g[nr][nc] != '.') continue;
                g[nr][nc] = 'x';
                visited++;
                st.push({nr, nc});
            }
        }
    } else {
        queue<pair<int,int>> q;
        q.push({sr, sc});
        g[sr][sc] = 'x';
        visited++;
        const int dr[] = {-1,1,0,0}, dc[] = {0,0,-1,1};
        while (!q.empty()) {
            auto [r, c] = q.front(); q.pop();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                if (g[nr][nc] != '.') continue;
                g[nr][nc] = 'x';
                visited++;
                q.push({nr, nc});
            }
        }
    }
    cout << visited << "\n";
    return 0;
}
