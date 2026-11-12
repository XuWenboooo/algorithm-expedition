// 斐波那契参考：n → value naive_calls memo_calls
#include <bits/stdc++.h>
using namespace std;
long long c1 = 0, c2 = 0;
long long fibNaive(int n) {
    c1++;
    if (n <= 2) return 1;
    return fibNaive(n - 1) + fibNaive(n - 2);
}
vector<long long> memo;
long long fibMemo(int n) {
    c2++;
    if (n <= 2) return 1;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
}
int main() {
    int n; cin >> n;
    memo.assign(n + 1, 0);
    long long v = fibNaive(n);
    long long w = fibMemo(n);
    cout << v << " " << w << " " << c1 << " " << c2 << "\n";
    return 0;
}
