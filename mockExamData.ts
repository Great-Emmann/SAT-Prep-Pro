import { MockExam } from "./types";

export const mockExam1: MockExam = {
  id: "mock-1",
  title: "Mock SAT Exam 1 (Adaptive Standard)",
  readingWriting: {
    module1: [
      {
        id: "rw-m1-q1",
        topic: "Vocabulary in Context",
        text: "The researcher's final conclusion was surprisingly ________; although there was very little direct empirical evidence to support it at the time, subsequent experiments fully validated her hypotheses.",
        options: [
          "A) tentative",
          "B) contentious",
          "C) prescient",
          "D) groundless"
        ],
        correctIndex: 2, // C
        explanation: "The sentence states that there was little empirical evidence 'at the time,' but 'subsequent experiments fully validated her hypotheses.' This means the researcher was able to foresee the correct conclusion before the evidence was available. 'Prescient' means having or showing knowledge of events before they take place, which fits the context perfectly."
      },
      {
        id: "rw-m1-q2",
        topic: "Central Ideas and Details",
        text: "In many of her novels, Virginia Woolf eschewed traditional linear narratives in favor of a 'stream of consciousness' style that mirrored the chaotic, fluid nature of human thought. By capturing the minute-by-minute perceptions of her characters, Woolf aimed to depict the internal, psychological reality of existence, rather than just external social interactions. Which choice best states the main idea of the text?",
        options: [
          "A) Woolf's novels focused primarily on criticizing Victorian external social structures.",
          "B) Woolf used innovative narrative techniques to capture the inner workings of human consciousness.",
          "C) Woolf believed that traditional linear storytelling was superior but too restrictive.",
          "D) Stream of consciousness is the only narrative style that can accurately depict reality."
        ],
        correctIndex: 1, // B
        explanation: "The text explains that Woolf 'eschewed traditional linear narratives in favor of a stream of consciousness style' in order to 'depict the internal, psychological reality of existence' and 'mirror the fluid nature of human thought.' Choice B accurately captures this main idea."
      },
      {
        id: "rw-m1-q3",
        topic: "Subject-Verb Agreement",
        text: "The pack of wolves, which contains several elder members and several newly born pups, ________ swiftly across the snowy tundra during the winter hunting season.",
        options: [
          "A) run",
          "B) runs",
          "C) running",
          "D) are running"
        ],
        correctIndex: 1, // B
        explanation: "The subject of the sentence is the singular noun phrase 'The pack of wolves' (specifically 'The pack'). The parenthetical clause 'which contains...' does not change the number of the subject. Therefore, we need the singular verb 'runs'."
      },
      {
        id: "rw-m1-q4",
        topic: "Transitions",
        text: "Geologists have long studied the movement of tectonic plates to predict volcanic activity. ________, predicting the exact day of an eruption remains an extremely elusive task due to the unpredictable behavior of magma chambers deep within the Earth.",
        options: [
          "A) Consequently",
          "B) Furthermore",
          "C) However",
          "D) For instance"
        ],
        correctIndex: 2, // C
        explanation: "The first sentence describes geologist efforts to predict volcanic activity. The second sentence points out the limitations of these efforts (predicting the exact day is elusive). This is a contrasting relationship, so 'However' is the correct transition."
      },
      {
        id: "rw-m1-q5",
        topic: "Rhetorical Synthesis",
        text: "While researching a topic, a student has taken the following notes:\n- Mars has two small, irregularly shaped moons: Phobos and Deimos.\n- Phobos is the larger of the two moons and orbits closer to Mars.\n- Deimos is smaller, further away, and has a much smoother surface.\n- Both moons were discovered in 1877 by astronomer Asaph Hall.\n\nThe student wants to emphasize the structural difference between Phobos and Deimos. Which choice most effectively uses information from the notes to accomplish this goal?",
        options: [
          "A) Discovered in 1877 by Asaph Hall, Phobos and Deimos are Mars's two small, irregularly shaped moons.",
          "B) Phobos and Deimos are small moons discovered in 1877, but Phobos orbits much closer to Mars.",
          "C) Phobos is larger and orbits closer to Mars, whereas the smaller Deimos has a smoother surface.",
          "D) Mars's two small moons, Phobos and Deimos, were both discovered by astronomer Asaph Hall."
        ],
        correctIndex: 2, // C
        explanation: "Choice C directly emphasizes structural and surface differences ('Phobos is larger... whereas the smaller Deimos has a smoother surface') which directly matches the student's goal of emphasizing structural differences."
      }
    ],
    module2Easy: [
      {
        id: "rw-m2e-q1",
        topic: "Vocabulary in Context",
        text: "Because the instructions for assembling the bookshelf were so ________, the students managed to complete the task in under fifteen minutes without any frustration.",
        options: [
          "A) ambiguous",
          "B) complex",
          "C) straightforward",
          "D) laborious"
        ],
        correctIndex: 2, // C
        explanation: "The sentence indicates the assembly was quick ('under fifteen minutes') and easy ('without any frustration'). This indicates the instructions were clear and simple, which is best captured by 'straightforward'."
      },
      {
        id: "rw-m2e-q2",
        topic: "Central Ideas and Details",
        text: "In many coastal ecosystems, seagrass meadows serve as critical habitats. They act as nurseries for young fish, stabilize shoreline sediments, and filter pollutants from the water. Despite their value, global seagrass coverage is declining rapidly due to coastal development and rising ocean temperatures. Which choice best states the main idea of the text?",
        options: [
          "A) Seagrass meadows are highly beneficial to coastal ecosystems but face severe threats.",
          "B) Coastal development is the single most destructive force affecting ocean marine life.",
          "C) Young fish cannot survive in coastal ecosystems without seagrass meadows.",
          "D) Rising ocean temperatures are the primary reason shorelines are destabilizing."
        ],
        correctIndex: 0, // A
        explanation: "The text explains the various benefits of seagrass meadows (nursery, stabilization, filter) but ends by highlighting that they are declining due to human development and temperature rises. Choice A captures both the benefits and the threats."
      },
      {
        id: "rw-m2e-q3",
        topic: "Pronoun-Antecedent Agreement",
        text: "Every student in the biology lab must clean ________ microscope and return it to the storage cabinet before leaving.",
        options: [
          "A) their",
          "B) its",
          "C) his or her",
          "D) they're"
        ],
        correctIndex: 2, // C
        explanation: "The subject 'Every student' is singular. 'His or her' is the traditional singular pronoun to refer to a single student of unspecified gender. (Note: While singular 'their' is widely accepted in modern English, standard SAT grammar often tests traditional singular singular pairing 'his or her' or has clear-cut options)."
      },
      {
        id: "rw-m2e-q4",
        topic: "Transitions",
        text: "Regular exercise has been shown to increase cardiovascular health and improve mood. ________, it can boost cognitive function and memory in older adults.",
        options: [
          "A) Instead",
          "B) In addition",
          "C) Consequently",
          "D) On the other hand"
        ],
        correctIndex: 1, // B
        explanation: "The sentence is adding another positive effect of exercise (boosting cognitive function) to the existing list (cardiovascular health, mood). 'In addition' is the correct additive transition."
      },
      {
        id: "rw-m2e-q5",
        topic: "Punctuation",
        text: "The three primary states of matter are solids, liquids, and gases; ________ plasma is often considered a fourth state under extreme temperature conditions.",
        options: [
          "A) however,",
          "B) however",
          "C) indeed",
          "D) because,"
        ],
        correctIndex: 0, // A
        explanation: "A semicolon is used here to join two independent clauses. The second clause begins with a transition 'however' followed by a comma, indicating a contrast with the three primary states."
      }
    ],
    module2Hard: [
      {
        id: "rw-m2h-q1",
        topic: "Vocabulary in Context",
        text: "The diplomat was known for her ________ demeanor; she navigated highly contentious international negotiations with an imperturbable calm that disarmed even her fiercest critics.",
        options: [
          "A) mercurial",
          "B) equable",
          "C) capricious",
          "D) loquacious"
        ],
        correctIndex: 1, // B
        explanation: "The diplomat navigates tense negotiations with 'imperturbable calm.' This indicates a steady, even-tempered disposition. 'Equable' means tranquil, steady, and not easily disturbed, which perfectly fits."
      },
      {
        id: "rw-m2h-q2",
        topic: "Command of Evidence",
        text: "Many literary critics argue that Mary Shelley's Frankenstein is not merely a gothic horror story, but also a critique of the scientific revolution's unchecked ambition. To support this, critics point to Victor Frankenstein's initial excitement, which quickly turns to absolute disgust upon the success of his creation, demonstrating that the pursuit of raw knowledge without ethical guardrails is self-destructive. Which of the following findings, if true, would most directly support the critics' argument?",
        options: [
          "A) Victor Frankenstein was modeled after several prominent romantic poets of the 19th century.",
          "B) Shelley wrote Frankenstein in response to a ghost story challenge during a rainy summer.",
          "C) In early manuscripts, Shelley explicitly compares Victor to Prometheus, a mythical figure punished for stealing fire (knowledge) from the gods.",
          "D) Contemporary scientific journals praised Frankenstein for its accurate portrayal of galvanism."
        ],
        correctIndex: 2, // C
        explanation: "The Prometheus comparison represents the archetypal warning against overreaching ambition and pursuing knowledge without regard to ethical limits. This finding provides direct textual/contextual evidence for the critics' argument."
      },
      {
        id: "rw-m2h-q3",
        topic: "Verb Tense and Aspect",
        text: "By the time the modern conservation team arrived on the island in 2012, several indigenous species of flora ________ extinct due to the introduction of invasive rodents a century prior.",
        options: [
          "A) have gone",
          "B) had gone",
          "C) went",
          "D) would go"
        ],
        correctIndex: 1, // B
        explanation: "The sentence mentions two actions in the past: the arrival in 2012, and the species going extinct. Because the extinction happened before the arrival ('By the time the team arrived...'), we use the past perfect tense ('had gone')."
      },
      {
        id: "rw-m2h-q4",
        topic: "Punctuation (Relative Clauses)",
        text: "The painting ________ which was rediscovered in an old attic in Brussels last year, has now been auctioned for over five million dollars.",
        options: [
          "A) —",
          "B) ,",
          "C) , which was rediscovered in an old attic in Brussels last year,",
          "D) which was rediscovered in an old attic in Brussels last year"
        ],
        correctIndex: 2, // C
        explanation: "The clause 'which was rediscovered in an old attic in Brussels last year' is a non-restrictive relative clause (it provides extra information but is not essential to identify the painting). Non-restrictive clauses must be set off by commas on both sides."
      },
      {
        id: "rw-m2h-q5",
        topic: "Transitions",
        text: "In his philosophical treatise, Thomas Hobbes argues that human nature is fundamentally competitive and self-interested, necessitating a strong, centralized authority to maintain order. ________, John Locke posits that humans are cooperative and possess natural rights, advocating for a representative government that can be dissolved if it fails to protect those rights.",
        options: [
          "A) In comparison",
          "B) Conversely",
          "C) Furthermore",
          "D) Specifically"
        ],
        correctIndex: 1, // B
        explanation: "Hobbes argues that human nature is competitive and needs central authority, while Locke argues the exact opposite (humans are cooperative and have rights). 'Conversely' represents this direct contrast between the two philosophical viewpoints."
      }
    ]
  },
  math: {
    module1: [
      {
        id: "math-m1-q1",
        topic: "Algebra",
        text: "If 3x + 7 = 22, what is the value of 2x - 3?",
        options: [
          "A) 5",
          "B) 7",
          "C) 10",
          "D) 12"
        ],
        correctIndex: 1, // B
        explanation: "First, solve 3x + 7 = 22 for x:\n3x = 15 => x = 5.\nThen substitute x = 5 into 2x - 3:\n2(5) - 3 = 10 - 3 = 7."
      },
      {
        id: "math-m1-q2",
        topic: "Advanced Math",
        text: "A quadratic function is defined by f(x) = x² - 6x + 5. What is the minimum value of f(x)?",
        options: [
          "A) -4",
          "B) 3",
          "C) 5",
          "D) -9"
        ],
        correctIndex: 0, // A
        explanation: "The minimum of a quadratic f(x) = ax² + bx + c occurs at x = -b / (2a). Here, a = 1, b = -6.\nx = -(-6) / (2 * 1) = 3.\nSubstitute x = 3 into f(x) to find the minimum value:\nf(3) = 3² - 6(3) + 5 = 9 - 18 + 5 = -4."
      },
      {
        id: "math-m1-q3",
        topic: "Geometry",
        text: "A right triangle has legs of length 6 and 8. What is the length of its hypotenuse?",
        options: [
          "A) 10",
          "B) 12",
          "C) 14",
          "D) 100"
        ],
        correctIndex: 0, // A
        explanation: "By the Pythagorean theorem, a² + b² = c².\n6² + 8² = c² => 36 + 64 = 100.\nc = √100 = 10."
      },
      {
        id: "math-m1-q4",
        topic: "Data Analysis",
        text: "A bag contains 5 red marbles, 3 blue marbles, and 2 green marbles. If a marble is selected at random, what is the probability of selecting a blue or green marble?",
        options: [
          "A) 0.3",
          "B) 0.5",
          "C) 0.2",
          "D) 0.8"
        ],
        correctIndex: 1, // B
        explanation: "Total marbles = 5 + 3 + 2 = 10.\nNumber of blue or green marbles = 3 (blue) + 2 (green) = 5.\nProbability = 5 / 10 = 0.5."
      },
      {
        id: "math-m1-q5",
        topic: "Algebra (Systems of Equations)",
        text: "Solve for y in the system of linear equations:\nx + y = 10\n2x - y = 8",
        options: [
          "A) 4",
          "B) 6",
          "C) 2",
          "D) 8"
        ],
        correctIndex: 0, // A
        explanation: "Add the two equations:\n(x + y) + (2x - y) = 10 + 8\n3x = 18 => x = 6.\nNow substitute x = 6 into the first equation:\n6 + y = 10 => y = 4."
      }
    ],
    module2Easy: [
      {
        id: "math-m2e-q1",
        topic: "Algebra",
        text: "If y = 4x - 5 and y = 11, what is the value of x?",
        options: [
          "A) 3",
          "B) 4",
          "C) 5",
          "D) 16"
        ],
        correctIndex: 1, // B
        explanation: "Substitute y = 11 into the first equation:\n11 = 4x - 5\n16 = 4x => x = 4."
      },
      {
        id: "math-m2e-q2",
        topic: "Advanced Math",
        text: "What is the product of the solutions to the equation x² - 9 = 0?",
        options: [
          "A) 9",
          "B) -9",
          "C) 0",
          "D) 3"
        ],
        correctIndex: 1, // B
        explanation: "x² - 9 = 0 can be factored as (x - 3)(x + 3) = 0.\nThe solutions are x = 3 and x = -3.\nTheir product is 3 * (-3) = -9. (Alternatively, by Vieta's formulas, product = c/a = -9/1 = -9)."
      },
      {
        id: "math-m2e-q3",
        topic: "Geometry",
        text: "The radius of a circle is 5. What is the area of the circle? (Use π ≈ 3.14)",
        options: [
          "A) 15.7",
          "B) 31.4",
          "C) 78.5",
          "D) 25"
        ],
        correctIndex: 2, // C
        explanation: "Area of a circle = πr².\nArea = π * 5² = 25 * π.\nWith π ≈ 3.14, Area ≈ 25 * 3.14 = 78.5."
      },
      {
        id: "math-m2e-q4",
        topic: "Data Analysis",
        text: "The test scores of 5 students are: 70, 80, 85, 90, 100. What is the median score of these students?",
        options: [
          "A) 80",
          "B) 85",
          "C) 90",
          "D) 87"
        ],
        correctIndex: 1, // B
        explanation: "The scores are already sorted in ascending order: 70, 80, 85, 90, 100. Since there are 5 numbers (an odd number), the median is the middle value, which is 85."
      },
      {
        id: "math-m2e-q5",
        topic: "Algebra",
        text: "A taxi charges a flat fee of $3.00 plus $1.50 per mile. If a passenger's total fare was $18.00, how many miles did they travel?",
        options: [
          "A) 10 miles",
          "B) 12 miles",
          "C) 8 miles",
          "D) 15 miles"
        ],
        correctIndex: 0, // A
        explanation: "Let m be the number of miles.\nFare equation: 3.00 + 1.50m = 18.00\n1.50m = 15.00\nm = 15.00 / 1.50 = 10 miles."
      }
    ],
    module2Hard: [
      {
        id: "math-m2h-q1",
        topic: "Advanced Math (Exponentials)",
        text: "An investment of $1,000 doubles in value every 8 years. Which of the following functions models the value, V(t), of the investment after t years?",
        options: [
          "A) V(t) = 1000 * 2^(8t)",
          "B) V(t) = 1000 * 2^(t/8)",
          "C) V(t) = 1000 * (1.125)^t",
          "D) V(t) = 1000 + 1000(2)^(t/8)"
        ],
        correctIndex: 1, // B
        explanation: "The investment starts at 1,000 and doubles (base 2) every 8 years. So the exponent must represent the number of 8-year periods, which is t/8. Thus, V(t) = 1000 * 2^(t/8)."
      },
      {
        id: "math-m2h-q2",
        topic: "Geometry (Circles)",
        text: "In the xy-plane, the equation of a circle is x² + y² - 4x + 6y = 3. What is the radius of this circle?",
        options: [
          "A) 3",
          "B) 4",
          "C) √16",
          "D) √3"
        ],
        correctIndex: 1, // B
        explanation: "To find the radius, complete the square for x and y:\n(x² - 4x) + (y² + 6y) = 3\nComplete the square for x: add (-4/2)² = 4 to both sides.\nComplete the square for y: add (6/2)² = 9 to both sides.\n(x² - 4x + 4) + (y² + 6y + 9) = 3 + 4 + 9\n(x - 2)² + (y + 3)² = 16\nThe standard form of a circle is (x - h)² + (y - k)² = r².\nHere, r² = 16, so radius r = √16 = 4."
      },
      {
        id: "math-m2h-q3",
        topic: "Advanced Math (Trigonometry)",
        text: "In a right triangle, sin(A) = 3/5. If angle A and angle B are the two acute angles of the triangle, what is the value of cos(B)?",
        options: [
          "A) 3/5",
          "B) 4/5",
          "C) 3/4",
          "D) Cannot be determined"
        ],
        correctIndex: 0, // A
        explanation: "In any right triangle, the two acute angles A and B are complementary (A + B = 90°). A fundamental trigonometric identity states that sin(A) = cos(90° - A) = cos(B). Since sin(A) = 3/5, cos(B) is also 3/5."
      },
      {
        id: "math-m2h-q4",
        topic: "Data Analysis (Statistics)",
        text: "A set of 10 data points has a mean of 50 and a standard deviation of 5. If a new data point with a value of 50 is added to the set, how do the mean and standard deviation of the new set compare to the original?",
        options: [
          "A) The mean increases, and the standard deviation decreases.",
          "B) The mean remains the same, and the standard deviation increases.",
          "C) The mean remains the same, and the standard deviation decreases.",
          "D) Both the mean and standard deviation remain the same."
        ],
        correctIndex: 2, // C
        explanation: "The new data point is exactly equal to the mean (50), so the average (mean) will remain unchanged at 50. However, because this new data point is right at the mean, it is closer to the mean than the average spread, thereby decreasing the overall dispersion or standard deviation."
      },
      {
        id: "math-m2h-q5",
        topic: "Algebra (Nonlinear Systems)",
        text: "How many points of intersection do the graphs of y = x² - 4x + 3 and y = 2x - 6 have in the xy-plane?",
        options: [
          "A) 0",
          "B) 1",
          "C) 2",
          "D) Infinitely many"
        ],
        correctIndex: 1, // B
        explanation: "To find the intersection points, set the equations equal to each other:\nx² - 4x + 3 = 2x - 6\nx² - 6x + 9 = 0\nThis can be factored as (x - 3)² = 0.\nThis has exactly one solution, x = 3. Substituting x = 3 into y = 2x - 6 gives y = 0. Since there is exactly one solution, there is exactly 1 intersection point."
      }
    ]
  }
};
