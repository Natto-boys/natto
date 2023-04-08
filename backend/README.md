# HingeGPT Backend

Stream GPT responses for dating app prompts.

# Run
### fly.io
This repo is configured to deploy on fly.io through a github action in `../.github/workflows/fly.yml`.


### Debug locally

To run locally, create an .env file with `OPENAI_KEY=<your-own-key-here>` and run:
```
pip install -r requirements.txt
python app.py
```
To make available on web:
```
ngrok http 8080
```

### Run Docker locally

Pull docker image:
```
docker pull birudeghi/continuousgpt:beta
```
Use your own OpenAI token in `docker-compose.yaml`:
```
OPENAI_KEY=<your-own-key-here>
```
Run docker:
```
docker-compose up -d
```

# API Reference

This server works on a simple WebSocket connection that accepts different types of events `ws://localhost:8080/`.

## To Server

### **********`text`********** event
Sends a Hinge profile name and prompt text, to respond to.

```json
{ 
 "event": "text",
 "name": "Jhamat",
 "text": "What I order for the table Wood varnish",
}
```

**Stream response**
```json
{
  "text": "",
  "stream": "start"
}
------
{
  "text": "This is the nature of...",
  "stream": "streaming"
}
------
{
  "text": "",
  "stream": "stop"
}
```

### **********`image`********** event
```json
{ 
 "event": "text",
 "content": "/9j/4AAQSkZJRgABAQAAAQABAAD/...", # base64 encoded string of image
}
```

**Response**
Note: returns `""` if it cannot find any hinge prompt type text in an image.
```json
{
  "text": "What I order for the table Wood varnish",
}
```

### Error response
```json
{
  "error": "There's a problem..."
}
```