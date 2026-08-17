# Contributing to AI-Nodes-agent

Thanks for considering a contribution! Contributions in the form of issues,
pull requests, and feature discussions are welcome.

## Ground rules

1. Be respectful and constructive.
2. Before starting on a large change, open an issue to discuss the approach.
3. Keep pull requests focused on a single change.
4. Make sure `npm run lint` and `npm run build` pass before submitting.

## License of contributions

AI-Nodes-agent is licensed under the Apache License, Version 2.0.
By submitting a contribution, you agree that your contribution is licensed
under the Apache License 2.0 as described in [LICENSE](LICENSE).

## Contributor License Agreement (CLA)

To keep the project's licensing clean and to allow the copyright owner
(WXL8000) to continue offering the software under other licensing models,
we require a simple CLA for any non-trivial contribution (code, not
comments/questions).

By submitting a pull request that contains code, you agree to the following
terms (this constitutes a "Contribution" under the Apache-2.0 grant
section of the license, plus the additional terms below):

1. **Grant of copyright license.** You grant WXL8000 a perpetual,
   worldwide, non-exclusive, royalty-free, irrevocable copyright license,
   with the right to sublicense, to use, reproduce, modify, publicly
   display, perform, and distribute your Contribution, both as part of
   AI-Nodes-agent and as part of any proprietary (closed-source) or
   dual-licensed version of the software.

2. **Grant of patent license.** You grant WXL8000 a perpetual, worldwide,
   non-exclusive, royalty-free, irrevocable patent license covering your
   Contribution, to the same extent as the patent grant in the
   Apache License 2.0.

3. **Originality.** You represent that each Contribution is your original
   work, or that you have the right to submit it under these terms, and
   that you are not aware of any third-party rights that would conflict
   with this agreement.

4. **No obligation.** You acknowledge that WXL8000 is not obligated to
   merge your Contribution, and that inclusion of the Contribution in any
   release is at the sole discretion of the project maintainer.

If you are contributing on behalf of your employer, or your contribution
includes work owned by your employer, you must have permission to bind
your employer to these terms; indicate this in the pull request.

**How to accept:** add the following line to your first pull request
description (or to a commit message):

    I have read the CONTRIBUTING.md and agree to its CLA terms.

## Adding dependencies

Only add dependencies with permissive licenses compatible with
Apache-2.0 (MIT, BSD, ISC, Apache-2.0). Strong copyleft licenses
(GPL/LGPL/AGPL) are not acceptable. New bundled dependencies must be
recorded in [NOTICE](NOTICE).

## Source file headers

Every new source file must start with the standard Apache-2.0 header:

    // Copyright 2026 WXL8000
    //
    // Licensed under the Apache License, Version 2.0 (the "License");
    // ... (see any existing source file for the full header)

When modifying an existing file in a substantial way, add a
"Modified in [yyyy] by [name]" line below the copyright notice, as
required by section 4(b) of the Apache License 2.0.
