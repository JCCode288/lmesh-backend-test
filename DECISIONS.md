# Architecture Decision Record

## 1. Asynchronous Processing
I am leveraging BullMQ for this process as we already had Redis to use.
The flow should look like this:
1. Request accepted
2. Record created for analysis purpose (Report, Analysis, FileData)
3. Analysis ID will be passed into analyze queue job
4. Report ID and Analysis ID will be sent to user
5. Job will start in processor
6. Processor will retrieve saved data
7. LLM will process the data
8. Result for the process is stored

## 2. AI Integration
I am using Langchain for agnostic AI integration. I am just using simple chain for this case (without memory). 
Langchain provide integration to listed provider said in `assesment-backend.md`.
Unparseable output is highly unlikely due to zod schema parsing the output from LLM strictly.
Malformed output should trigger error when zod try to parse the output

## 3. Resilience
System will try 3 times with strategy backoff 2 seconds to accomodate rate limit for API (2, 4, 6 ..). After third times failing, it will set analysis status to `FAILED`. Wrong data, empty file and such will not trigger retry (using UnrecoverableError from BullMQ)

## 4. Data Access Layer
Any logic to retrieve data to database is abstracted to repository, any business logic to for the app is separated in service. I want single responsibilty to reduce cognitive loads when reading the code

## 5. What you would do differently
I would separating agent module and make it more templateable for future use in different case. I also will make functionals more resilient by using transaction wrapper instead of current implementation