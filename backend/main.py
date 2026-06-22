from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

import models, database, auth
from scraper import scrape_google_shopping

# Initialize DB
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job tracker for the Background Tasks
jobs = {}

class SearchQuery(BaseModel):
    query: str

def background_scrape_job(job_id: str, query: str, db: Session):
    try:
        results = scrape_google_shopping(query)
        sorted_results = sorted(
            [r for r in results if r.get("price_float") is not None], 
            key=lambda x: x["price_float"]
        )
        
        # Save to DB (Level 10 Feature: Price History)
        for r in sorted_results:
            db_record = models.PriceHistory(
                query=query,
                vendor=r["vendor"],
                price_float=r["price_float"]
            )
            db.add(db_record)
        db.commit()
        
        jobs[job_id] = {"status": "completed", "results": sorted_results}
    except Exception as e:
        jobs[job_id] = {"status": "failed", "error": str(e)}

@app.post("/api/search")
def search_product_async(request: SearchQuery, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query is required")
        
    # Generate a unique job ID and hand it off to the background task queue
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing", "query": request.query}
    
    background_tasks.add_task(background_scrape_job, job_id, request.query, db)
    
    return {"job_id": job_id, "message": "Search queued in background"}

@app.get("/api/results/{job_id}")
def get_results(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.get("/api/history/{query}")
def get_price_history(query: str, db: Session = Depends(database.get_db)):
    records = db.query(models.PriceHistory).filter(models.PriceHistory.query == query).all()
    history = [{"date": r.timestamp.strftime("%Y-%m-%d %H:%M"), "price": r.price_float, "vendor": r.vendor} for r in records]
    return {"history": history}

# --- PHASE 2: AUTH & TRACKING ---

class UserCreate(BaseModel):
    email: str
    password: str

class TrackItem(BaseModel):
    query: str
    target_price: float

@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/track")
def track_product(item: TrackItem, db: Session = Depends(database.get_db), current_user: str = Depends(auth.get_current_user)):
    user = db.query(models.User).filter(models.User.email == current_user).first()
    alert = models.Alert(query=item.query, target_price=item.target_price, owner_id=user.id)
    db.add(alert)
    db.commit()
    return {"message": f"Tracking '{item.query}' for drops below ₹{item.target_price}"}

@app.get("/api/tracked")
def get_tracked_items(db: Session = Depends(database.get_db), current_user: str = Depends(auth.get_current_user)):
    user = db.query(models.User).filter(models.User.email == current_user).first()
    alerts = db.query(models.Alert).filter(models.Alert.owner_id == user.id).all()
    return {"tracked_items": [{"query": a.query, "target_price": a.target_price} for a in alerts]}

# APScheduler Background Tracker
from apscheduler.schedulers.background import BackgroundScheduler

def autonomous_tracker():
    print("[APScheduler] Waking up to check tracked prices...")
    db = database.SessionLocal()
    alerts = db.query(models.Alert).all()
    
    for alert in alerts:
        # In a real app, we'd use Proxies here so it doesn't get blocked
        # For demo, we rely on the Demo Mode fallback logic which still injects mock results
        results = scrape_google_shopping(alert.query)
        if not results: continue
        
        # Sort to find cheapest
        sorted_results = sorted([r for r in results if r.get("price_float") is not None], key=lambda x: x["price_float"])
        cheapest = sorted_results[0]
        
        if cheapest["price_float"] <= alert.target_price:
            user = db.query(models.User).filter(models.User.id == alert.owner_id).first()
            print(f"[ALERT] {user.email}! {alert.query} dropped to ₹{cheapest['price_float']} on {cheapest['vendor']}!")
            # TODO: Integrate SendGrid or Telegram Bot here
            
    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(autonomous_tracker, 'interval', hours=6) # Runs every 6 hours
scheduler.start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
