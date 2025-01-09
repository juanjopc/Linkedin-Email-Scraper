# 🕵️ LinkedIn Email Scraper

A simple tool to extract emails and phone numbers from LinkedIn profiles.

---

## What does this program do?

1. Searches LinkedIn profiles using specific keywords.  
2. Automatically browses those profiles.  
3. Extracts emails and phone numbers from the profiles.  
4. Saves the results in a neat Excel file.  

---

## Requirements

Make sure you have the following before starting:

1. **Google Chrome** (web browser).  
2. **Node.js** (to run the program).  
3. A **Serper API key** (free to obtain):  
   - Get it here: [https://serper.dev/](https://serper.dev/)  
4. A **Google Gemini API key** (also free):  
   - Get it here: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)  
5. A **Google Chrome profile path**:  
   - **For Windows**:  
     C:\Users\YOUR_USERNAME\AppData\Local\Google\Chrome\User Data\Default  
   - **For Mac**:  
     /Users/YOUR_USERNAME/Library/Application Support/Google/Chrome/Default  

---

## How to use it

1. **Download the program**:  
   - Clone the repository using `git clone`  
   - Or download the ZIP file.  

2. **Navigate to the folder** where the program is saved.  

3. **Install the dependencies**:  
   Open your terminal and run:  
   npm install  

4. **Run the program**:  
   In the terminal, use the following command:  
   node main.js "Topic_to_search" "country_code" number(between 1-3)  

   Example:  
   node main.js "civil engineer" "mx" 2  

---

## Output

The program will generate an Excel file with the results. Simple and efficient!
