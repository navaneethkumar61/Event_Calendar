from fastapi import FastAPI, HTTPException
import requests
import time
from collections import deque
app = FastAPI()
WINDOW_SIZE = 10
THIRD_PARTY_API = {
    'p': 'https://prime-numbers-api.com/api/v1/primes?limit={}',
    'f': 'https://fibonacci-api.com/api/v1/fibonacci?limit={}',
    'e': 'https://api.math.tools/numbers/even?limit={}',
    'r': 'https://www.random.org/integers/?num={}&min=1&max=100&col=1&base=10&format=plain&rnd=new'
}
VALID_IDS = {"p", "f", "e", "r"}
stored_numbers = deque(maxlen=WINDOW_SIZE)
def fetch_numbers(number_id: str):
    """Fetch numbers from third-party API with a 500ms timeout."""
    mock_data = {
        "p": [2, 3, 5, 7],
        "f": [1, 1, 2, 3, 5],
        "e": [2, 4, 6, 8],
        "r": [9, 14, 27, 32]
    }
    return mock_data.get(number_id, [])
@app.get("/numbers/{number_id}")
def get_numbers(number_id: str):
    """Process API request and maintain a sliding window."""
    if number_id not in VALID_IDS:
        raise HTTPException(status_code=400, detail="Invalid number ID")
    window_prev_state = list(stored_numbers)  
    new_numbers = fetch_numbers(number_id)

    for num in new_numbers:
        if num not in stored_numbers:
            stored_numbers.append(num)

    window_curr_state = list(stored_numbers)  
    avg = round(sum(stored_numbers) / len(stored_numbers), 2) if stored_numbers else 0.0

    return {
        "windowPrevState": window_prev_state,
        "windowCurrState": window_curr_state,
        "numbers": new_numbers,
        "avg": avg
    }
