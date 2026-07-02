## Summary

<!-- What changed and why -->

## Type

- [ ] Bug fix (Personal / production)
- [ ] Personal product improvement
- [ ] Feature flag platform (NS-55)
- [ ] Parked product work (Teams / Enterprise / Passkeys — behind flags)

## Feature flags (required for parked product work)

| Question | Answer |
|----------|--------|
| Flag key used | <!-- e.g. teams, passkeys — or N/A --> |
| Default in production | <!-- must be false --> |
| Routes / nav gated | <!-- list paths hidden when flag off --> |

## Safety checklist

- [ ] No import from `src/features/teams` or `src/features/enterprise` without flag guard
- [ ] New routes use lazy load + flag guard pattern
- [ ] Deep links return Not Found when flag is off

## Docs

- [ ] Notion story page updated if needed

## Test plan

<!-- Manual steps -->
