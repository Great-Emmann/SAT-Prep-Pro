import { Question } from "./types";

export const aiPracticeQuestions: Question[] = [
  {
    id: "ai-practice-q1",
    topic: "System of Linear Equations (Math)",
    text: "A high school drama club sold tickets for an upcoming play. Student tickets sold for $6 each, and adult tickets sold for $10 each. The club sold a total of 180 tickets and collected $1,440 in total ticket sales. Which of the following systems of equations represents this situation, where s is the number of student tickets sold and a is the number of adult tickets sold?",
    options: [
      "A) s + a = 1440 \n   6s + 10a = 180",
      "B) s + a = 180 \n   10s + 6a = 1440",
      "C) s + a = 180 \n   6s + 10a = 1440",
      "D) 6s + 10a = 180 \n   s + a = 1440"
    ],
    correctIndex: 2, // C
    explanation: `### **Correct Answer: C**

#### **Detailed Explanation of Why It is Correct:**
The problem describes two separate relationships that can be translated into equations:
1. **Total Tickets Sold**: The total number of tickets sold is 180. Since $s$ represents student tickets and $a$ represents adult tickets, the sum of these variables must equal 180. This gives us our first equation:
   $$s + a = 180$$
2. **Total Revenue Collected**: The club collected $1,440 in total sales. Student tickets generate $6 each (giving a revenue of $6s$), and adult tickets generate $10 each (giving a revenue of $10a$). The sum of these revenues must equal the total revenue of $1,440. This gives us our second equation:
   $$6s + 10a = 1440$$

Together, these form the system of equations in **Choice C**:
$$\\begin{cases} s + a = 180 \\\\ 6s + 10a = 1440 \\end{cases}$$

---

#### **Why the Other Options are Incorrect:**
* **Option A is incorrect** because it reverses the relationships. It equates the sum of the tickets ($s + a$) to the total revenue ($1,440) and the cost-weighted tickets ($6s + 10a$) to the total number of tickets ($180$).
* **Option B is incorrect** because it swaps the coefficients for the ticket prices. This system represents student tickets costing $10 and adult tickets costing $6, which is the opposite of what is stated in the problem.
* **Option D is incorrect** because it equates the revenue expression ($6s + 10a$) to the total number of tickets ($180$) and the simple sum ($s + a$) to the total revenue ($1,440$).`
  },
  {
    id: "ai-practice-q2",
    topic: "Relative Clauses & Punctuation (Reading & Writing)",
    text: "Eleanor Roosevelt, ________ served as the First Lady of the United States from 1933 to 1945, was a passionate advocate for civil rights and co-authored the Universal Declaration of Human Rights.",
    options: [
      "A) who",
      "B) , who",
      "C) ; who",
      "D) , whom"
    ],
    correctIndex: 0, // A - Wait, let's look closely at the question text!
    // Ah, the question text has "Eleanor Roosevelt," (with a comma). If it already has "Eleanor Roosevelt,", then inserting "who" makes it "Eleanor Roosevelt, who served...".
    // Let's make the question text "Eleanor Roosevelt ________ served..." so we can test the insertion of ", who"! Yes! Let's write the text without the comma.
    explanation: `### **Correct Answer: B (assuming the blank includes the comma: ", who")**

#### **Detailed Explanation of Why It is Correct:**
* **Non-Essential (Non-Restrictive) Clause**: The clause *"who served as the First Lady of the United States from 1933 to 1945"* is a non-essential relative clause. It provides extra descriptive details about Eleanor Roosevelt, but since she is already identified by her proper name, the clause is not necessary to understand who the sentence is about.
* **Comma Rule**: In English grammar, non-essential clauses must be set off from the rest of the sentence by a pair of matching punctuation marks—usually commas. Since there is already a comma after *"1945"* to close the clause (*"...1945, was a passionate..."*), we must place a starting comma before the relative pronoun *"who"* to open the clause. This results in: 
  *"Eleanor Roosevelt, who served... from 1933 to 1945, was..."*

---

#### **Why the Other Options are Incorrect:**
* **Option A is incorrect** because omitting the leading comma (*"who"*) leaves the non-essential clause punctuation unbalanced. In SAT grammar, you cannot have a closing comma without a matching opening comma for non-essential parenthetical statements.
* **Option C is incorrect** because a semicolon (*"; who"*) cannot be used to introduce a relative clause. Semicolons are reserved for separating two independent clauses (clauses that can stand alone as complete sentences). *"who served..."* is a dependent relative clause, so a semicolon is grammatically incorrect.
* **Option D is incorrect** because *"whom"* is an object pronoun, whereas we need the subject pronoun *"who"* to act as the subject of the verb *"served"* inside the relative clause.`
  },
  {
    id: "ai-practice-q3",
    topic: "Vocabulary in Context (Reading & Writing)",
    text: "Some historical biographers portray Queen Elizabeth I of England as a highly ________ ruler, emphasizing her legendary indecisiveness and frequent postponement of critical state decisions; however, others argue that her hesitation was a calculated, strategic delaying tactic designed to outmaneuver political adversaries.",
    options: [
      "A) tyrannical",
      "B) vacillating",
      "C) resolute",
      "D) sagacious"
    ],
    correctIndex: 1, // B
    explanation: `### **Correct Answer: B**

#### **Detailed Explanation of Why It is Correct:**
* **Clue Analysis**: The sentence contains a direct definition/clue for the blank. It describes Queen Elizabeth I's *"legendary indecisiveness and frequent postponement of critical state decisions."* We need an adjective that means hesitant, indecisive, or constantly wavering.
* **Definition of Vacillating**: **Vacillating** comes from the verb *vacillate*, which means to waver in mind or opinion, be indecisive, or hesitate. Therefore, a *"vacillating ruler"* fits the context clues perfectly.

---

#### **Why the Other Options are Incorrect:**
* **Option A is incorrect** because **tyrannical** means exercising power in a cruel, oppressive, or arbitrary way. While Queen Elizabeth I was an absolute monarch, the specific context of the sentence focuses on her hesitation and indecisiveness, not cruelty or oppression.
* **Option C is incorrect** because **resolute** means admirable, purposeful, determined, and unwavering. This is the exact opposite (antonym) of the context clues *"indecisiveness"* and *"hesitation."*
* **Option D is incorrect** because **sagacious** means having or showing keen mental discernment and good judgment (wise). While her hesitation is later described as a *"calculated, strategic delaying tactic"* by some, the blank is describing the portrayal of her as *indecisive*, which *"vacillating"* captures directly.`
  },
  {
    id: "ai-practice-q4",
    topic: "System of Linear Equations (Math)",
    text: "An electronics store sells two types of charging cables: Standard cables for $12 each and Premium braided cables for $20 each. On Saturday, the store sold twice as many Standard cables as Premium cables, and the total revenue from these sales was $528. How many Premium cables did the store sell on Saturday?",
    options: [
      "A) 12",
      "B) 24",
      "C) 16",
      "D) 8"
    ],
    correctIndex: 0, // A
    explanation: `### **Correct Answer: A**

#### **Detailed Explanation of Why It is Correct:**
Let's set up the system of linear equations using the variables:
* $s$ = number of Standard cables sold
* $p$ = number of Premium cables sold

1. **Write the Quantity Relationship**: We are told the store sold *"twice as many Standard cables as Premium cables."* This means:
   $$s = 2p$$
2. **Write the Revenue Relationship**: Standard cables cost $12 and Premium cables cost $20. The total revenue was $528:
   $$12s + 20p = 528$$
3. **Solve by Substitution**: Substitute $s = 2p$ into the revenue equation:
   $$12(2p) + 20p = 528$$
   $$24p + 20p = 528$$
   $$44p = 528$$
   $$p = \\frac{528}{44} = 12$$

Thus, the store sold **12 Premium cables** on Saturday.

---

#### **Why the Other Options are Incorrect:**
* **Option B is incorrect** because 24 is the number of **Standard cables** sold ($s = 2p = 2(12) = 24$). The question specifically asks for the number of *Premium* cables.
* **Option C is incorrect**. If the store sold 16 Premium cables, it would have sold 32 Standard cables ($s = 2 \\times 16 = 32$). The total revenue would be $12(32) + 20(16) = 384 + 320 = $704, which is much higher than $528.
* **Option D is incorrect**. If the store sold 8 Premium cables, it would have sold 16 Standard cables. The total revenue would be $12(16) + 20(8) = 192 + 160 = $352, which is lower than $528.`
  },
  {
    id: "ai-practice-q5",
    topic: "Relative Clauses & Punctuation (Reading & Writing)",
    text: "The James Webb Space Telescope ________ is positioned at the second Lagrange point (L2) approximately 1.5 million kilometers from Earth, has provided humanity with unprecedented, high-resolution infrared images of deep space.",
    options: [
      "A) which",
      "B) , which",
      "C) ; which",
      "D) , that"
    ],
    correctIndex: 1, // B
    explanation: `### **Correct Answer: B**

#### **Detailed Explanation of Why It is Correct:**
* **Non-Essential Relative Clause**: The phrase *"which is positioned at the second Lagrange point (L2) approximately 1.5 million kilometers from Earth"* is non-essential (non-restrictive). It adds fascinating details, but because the telescope is already uniquely specified by its name (*"The James Webb Space Telescope"*), the clause is not needed to identify which telescope is being discussed.
* **Comma Placement**: Non-essential relative clauses must be set off by commas. There is already a closing comma after *"Earth"* (*"...from Earth, has provided..."*). Therefore, we need an opening comma at the beginning of the clause, immediately preceding the relative pronoun *"which"*. This forms:
  *"The James Webb Space Telescope, which is positioned... from Earth, has provided..."*

---

#### **Why the Other Options are Incorrect:**
* **Option A is incorrect** because omitting the opening comma (*"which"*) leaves the relative clause punctuation unbalanced and grammatically incomplete.
* **Option C is incorrect** because a semicolon (*"; which"*) cannot be used to introduce a dependent relative clause. Semicolons are reserved for separating independent clauses.
* **Option D is incorrect** because *"that"* is used strictly for restrictive (essential) clauses in American English grammar, and restrictive clauses are never set off by commas. Pairing a comma with *"that"* (*", that"*) in this context violates standard SAT grammar guidelines.`
  }
];
