from itertools import combinations, product


def generate_variants(numbers):
    """
    Generate all possible variants of the hand where 3 and 6 are
    interchangeable.  For each position that contains a 3 or 6, the
    generator yields versions with both values.  Numbers other than
    3 and 6 are left unchanged.

    Example:
        [3, 1, 6] → [3,1,6], [3,1,3], [6,1,6], [6,1,3]
    """
    options = []
    for n in numbers:
        if n == 3:
            options.append([3, 6])
        elif n == 6:
            options.append([6, 3])
        else:
            options.append([n])

    seen = set()
    for combo in product(*options):
        if combo not in seen:
            seen.add(combo)
            yield list(combo)


def _evaluate_hand(numbers):
    """
    Core Niu Niu evaluation for a single set of 5 numbers (no swapping).

    Returns:
        (has_niu, best_score, is_double, best_trio, best_pair)
        - is_double: True if the remaining pair has the same value (2× earning)
    """
    best_score = -1
    best_is_double = False
    best_trio = None
    best_pair = None

    indices = list(range(5))

    for trio_indices in combinations(indices, 3):
        trio = [numbers[i] for i in trio_indices]
        trio_sum = sum(trio)

        if trio_sum % 10 != 0:
            continue

        pair_indices = [i for i in indices if i not in trio_indices]
        pair = [numbers[i] for i in pair_indices]
        pair_sum = sum(pair)

        score = pair_sum % 10
        if score == 0:
            score = 10  # Niu Niu! (Bull Bull)

        is_double = pair[0] == pair[1]

        # Prioritize: double pair > non-double pair (double = 2× earning)
        # Among same category, pick the higher score.
        if _is_better(score, is_double, best_score, best_is_double):
            best_score = score
            best_is_double = is_double
            best_trio = trio
            best_pair = pair

    has_niu = best_score > 0
    return has_niu, best_score, best_is_double, best_trio, best_pair


def _is_better(new_score, new_double, old_score, old_double):
    """
    Determine if the new combination is better than the current best.

    Priority order:
      1. Double pair always beats non-double pair (2× earning).
      2. Within the same double/non-double category, higher score wins.
    """
    if old_score < 0:
        return True  # No previous result
    if new_double and not old_double:
        return True   # Double always beats non-double
    if not new_double and old_double:
        return False  # Non-double never beats double
    return new_score > old_score  # Same category → compare scores


def calculate_niu_niu(numbers):
    """
    Given 5 numbers, find the best Niu Niu (牛牛) hand, considering
    that 3 and 6 are interchangeable.

      1. Generate every variant of the hand (swapping 3↔6).
      2. Evaluate each variant.
      3. Return the best result, prioritizing double pairs (2× earning).

    Returns:
        (has_niu, best_score, is_double, best_trio, best_pair, used_variant)
        - has_niu: True if a valid combination exists
        - best_score: The highest mark achievable (1–10, where 10 = Niu Niu)
        - is_double: True if the pair has matching values (2× earning)
        - best_trio: The 3 numbers forming the multiple-of-10 group
        - best_pair: The remaining 2 numbers
        - used_variant: The variant of the hand that produced the best score
    """
    # (score, is_double, trio, pair, variant)
    overall_best = (-1, False, None, None, None)

    for variant in generate_variants(numbers):
        has_niu, score, is_double, trio, pair = _evaluate_hand(variant)
        if has_niu and _is_better(score, is_double, overall_best[0], overall_best[1]):
            overall_best = (score, is_double, trio, pair, variant)

    if overall_best[0] > 0:
        score, is_double, trio, pair, variant = overall_best
        return True, score, is_double, trio, pair, variant
    else:
        return False, -1, False, None, None, numbers


def display_result(numbers, has_niu, score, is_double, trio, pair, used_variant):
    """Pretty-print the result of a Niu Niu hand."""
    print("=" * 40)
    print(f"  Hand: {numbers}")

    # Show the variant used if it differs from the original hand
    if used_variant != numbers and has_niu:
        print(f"  Used (3↔6 swap): {used_variant}")

    print("=" * 40)

    if has_niu:
        print(f"  ✅ Valid Niu combo found!")
        print(f"  Group of 3 (multiple of 10): {trio}  →  sum = {sum(trio)}")
        print(f"  Remaining pair:              {pair}  →  sum = {sum(pair)}")
        if is_double:
            print(f"  💎 Double pair! ({pair[0]} = {pair[1]})  →  2× earning!")
        if score == 10:
            print(f"  🏆 Score: {score}  (Niu Niu! — Best possible!)")
        else:
            print(f"  📊 Score: {score}")
    else:
        print("  ❌ No valid combination — No Niu (没牛)")

    print()


FACE_CARDS = {'k': 10, 'j': 10, 'q': 10, 'a': 1}


def parse_card(token):
    """
    Parse a single card token into its numeric value.
      - k / K  → 10  (King)
      - j / J  → 10  (Jack)
      - q / Q  → 10  (Queen)
      - a / A  →  1  (Ace)
      - Otherwise, parse as an integer.
    """
    lower = token.lower()
    if lower in FACE_CARDS:
        return FACE_CARDS[lower]
    return int(token)


def main():
    print("╔══════════════════════════════════════╗")
    print("║       🐂  Niu Niu Calculator  🐂      ║")
    print("║     (3 ↔ 6 are interchangeable)      ║")
    print("║   K/J/Q = 10 · A = 1 · quit = exit  ║")
    print("╚══════════════════════════════════════╝")
    print()

    while True:
        user_input = input("Enter 5 cards separated by spaces (or 'quit' to exit): ").strip()

        if user_input.lower() == 'quit':
            print("Goodbye! 👋")
            break

        tokens = user_input.split()

        if len(tokens) != 5:
            print(f"⚠️  Expected 5 cards, but got {len(tokens)}. Try again.\n")
            continue

        try:
            numbers = [parse_card(t) for t in tokens]
        except ValueError:
            print("⚠️  Invalid input. Use numbers (1-10) or letters (K, J, Q, A).\n")
            continue

        has_niu, score, is_double, trio, pair, used_variant = calculate_niu_niu(numbers)
        display_result(numbers, has_niu, score, is_double, trio, pair, used_variant)


if __name__ == "__main__":
    main()
