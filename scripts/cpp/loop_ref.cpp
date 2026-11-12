// 循环求和参考：n → 1+2+...+n
#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    long long sum = 0;
    for (long long i = 1; i <= n; i++) sum += i;
    cout << sum << "\n";
    return 0;
}
