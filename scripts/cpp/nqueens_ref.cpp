// N 皇后参考（回溯 + 剪枝）：n → 解数 + 剪枝次数（与 TS 轨迹同一计数口径）
#include <bits/stdc++.h>
using namespace std;

long long solutions = 0;
long long pruned = 0;
vector<int> board;

bool conflicts(int row, int col) {
    for (int r = 0; r < row; r++) {
        if (board[r] == col) return true;
        if (abs(board[r] - col) == row - r) return true;
    }
    return false;
}

void solve(int row, int n) {
    if (row == n) { solutions++; return; }
    for (int col = 0; col < n; col++) {
        if (conflicts(row, col)) { pruned++; continue; }
        board[row] = col;
        solve(row + 1, n);
        board[row] = -1;
    }
}

int main() {
    int n;
    cin >> n;
    board.assign(n, -1);
    solve(0, n);
    cout << solutions << " " << pruned << "\n";
    return 0;
}
