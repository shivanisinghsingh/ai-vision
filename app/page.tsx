"use client"
import React, { useState } from "react";
import BackgroundSVG from "@/component/SVGBG"; // Import SVG component
import Header from "@/component/header"; // Import Header component


const HomePage = () => {

  const [image, setImage] = useState<File | null>(null);
  const [loading , setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null); //store the text result of the image analysis
  const [keywords, setKeywords] = useState<string[]>([]); //store the keywords of the image analysis
  const [relatedquestion, setRelatedQuestion] = useState<string[]>([]);  
  // Function to handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);  //console.log("Image uploaded:", file.name);
    }
  };

  const identifyImage = async ( additionalPrompt:String="") => {
    if (!image) return;
      setLoading(true);
      
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      try {
        const imagePart = await fileToGenerativePart(image); // Convert file to generative format
      
        const result = await model.generateContent({
          contents: [
            {
              parts: [
                { text: `Analyze the image and provide a detailed description. ${additionalPrompt}` },
                imagePart // Include the image data properly
              ]
            }
          ]
        });
      
        const response = await result.response;
        const generatedText=response
        .text()
        .trim()
        .replace(/```/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/-\s*/g, "")
        .replace(/\n\s*\n/g, "\n");
        setResponse(generatedText);
        generateKeywords(generatedText);
        await getRelatedQuestions(generatedText);
        

        //Giving a text as not paragraph but with separate discriprion
        const resulttext = response.text().trim();
        setResponse(resulttext);
        

        //console.log("Response:", text);
        //console.log("Response:", response);
      } catch (error) {
        console.error("Error analyzing image:", error);
      }
      finally {
        setLoading(false);
      }
  };


  async function fileToGenerativePart(file: File): Promise<{
    inlineData: { data: string; mimeType: string };
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(",")[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }


  const formatResponseText = (text: string) => {
    return text.split("*").map((line, index) => {
      if (line.trim()) {
        return <p key={index} className="mb-2 mt-4">{line.trim()}</p>;
      }
      return null;
    });
  };

  const generateKeywords = async (text: string) => {
  if(!text) return;
  const words = text.replace(/[^\w\s]/g, "").split(/\s+/);
  const kewordsSet = new Set<string>();
  words.forEach((word) => {
    if (word.length > 4 && !["this","that","with","from","have","heres","thats"].includes(word.toLowerCase())) {
      kewordsSet.add(word);
    }

  })
  setKeywords(Array.from(kewordsSet).slice(0,5));
  };

  const regeneratekeyword = (keyword: string) => {
    identifyImage(`Focus more on aspects related to "${keyword}".`);
  };
    
    const getRelatedQuestions = async (text: string) => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
      const result = await model.generateContent({
        contents: [
          {
            parts: [
              { text: `Based on the following information about an image, generate 5 related questions that someone might ask to learn more about the subject of the image:
              
              ${text}
    
              Format the output as a single list of questions, each on a new line.` },
            ],
          },
        ],
      });
      const response = await result.response;
      const questions = response.text().trim().split("\n");
      setRelatedQuestion(questions);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setRelatedQuestion([]);
    }
  }

  const askRelatedquestion = async (question:String) => {
    identifyImage('Anser the following question about the image ${question}');
  }

    return (
    <main className="relative flex flex-col items-center justify-center min-h-screen min-w-full bg-gray-900 ">
      {/* Background SVG */}
      <BackgroundSVG className="absolute w-full h-full" />
      <header className="absolute top-0 left-0 w-full p-5">
        <div className="container mx-auto flex items-center">
          {/* Logo on the Left */}
          <img src="/logo.png" alt="AI Vision" className="h-14  w-auto" />
          <h1 className="text-2xl font-bold text-grey-600">AI Vision</h1>
        </div>
      </header>
     <Header />
      {/* Foreground Content */}
      <div className="relative z-10 text-white text-center mt-24 md:mt-40 mb-6"><h1 className="text-4xl md:text-4xl font-bold leading-normal">Free AI Image Analyzer Chatbot</h1></div>
      <div className="relative z-10 text-white text-center p-6 bg-black/40 rounded-xl lg:w-[60rem] md:w-[40rem]">
      <div className="mb-4">
        <label htmlFor="image-upload" className="block text-white text-left leading-loose">Upload an image to get started</label>
        <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload}  className="block w-full text-sm leading-normal
             file:mr-4 file:py-2 file:px-4 file:rounded-full file:border:0 file:text-sm file:font-semibold file:bg-white file:text-orange-700 transition duration-150 ease-in-out"/>
      </div>
      {image && (
        <div className="relative w-full h-96 mb-8 flex justify-center">
          <img src={URL.createObjectURL(image)} alt="Uploaded Image" width={300} height={300} className="object-contain  rounded-xl">
          </img>
        </div> )}
      <button type="button" disabled={!image || loading } className="w-full bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => identifyImage()}>
        {loading ? "Analyzing Image..." : "Analyze Image"}
      </button>
      {response && (
        <div className="mt-6 mb-10 p-4 text-left">
          <h3 className="text-xl text-yellow-400 font-semibold">AI Analysis:</h3>
          {formatResponseText(response)}
        </div>
      )}
      {/* Keywords */}
      {keywords && keywords.length > 0 ? (
        <div className="mt-3 text-left">
          <h4 className="text-xl text-yellow-400 font-semibold mb-4">Related Keywords</h4>
          <div>
            {keywords.map((keyword, index) => (
              <button
                type="button"
                key={index}
                onClick={() => regeneratekeyword(keyword)}
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 mr-2 rounded-full mb-2"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Related Questions */}
      {relatedquestion.length > 0 && (
        <div className="mt-3 text-left ">
        <h4 className="text-xl text-yellow-400 font-semibold mb-4">Related Questions</h4>
        <ul className="space-y-3">
          {relatedquestion.map((question, index) => (
            <li key={index}>
              <button  type="button"  className="text-left w-full bg-yellow-200 text-orange-700 px-4 py-2 rounded-xl" onClick={() => askRelatedquestion(question)} >{question}</button>
            </li>
          ))}
        </ul>
        </div>
      )}
    </div>
      <section id="how-it-work" className="relative mt-16 mb-16 px-4">
      <h2 className=" text-3xl md:text-4xl font-bold text-white text-center mb-8">How It Works</h2>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {["Upload Image", "AI Analysis", "Get Result"].map((step, index) => (
      <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-lg text-center  transition duration-300 ease-in-out transform hover:scale-105">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{step}</h3>
        <p className="text-gray-300">
          {index === 0 && "Select or drag-and-drop an image to get started."}
          {index === 1 && "Our AI processes the image and extracts key details."}
          {index === 2 && "View the AI-generated insights and results."}
        </p>
      </div>
    ))}
  </div>
</section>
<section id="features" className="mt-16 mb-10 relative px-4">
  <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">Features</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
    {[
      { title: "Fast Image Upload", description: "Easily upload your images in seconds." },
      { title: "AI-Powered Analysis", description: "Our AI extracts key details and insights instantly." },
      { title: "Accurate Results", description: "Get precise and meaningful descriptions of your images." },
      { title: "User-Friendly Interface", description: "A simple, intuitive, and easy-to-use platform." },
    ].map((feature, index) => (
      <div key={index} className="bg-[#fcff6d] p-6 rounded-lg shadow-lg text-center  transition duration-300 ease-in-out transform hover:scale-105">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
      </div>
    ))}
  </div>
</section>
<footer className="relative text-white py-8 mt-16 w-full"><div className="mx-auto px-4 sm:px-6 lg:px-8 text-center"><p>© 2025 AI Vision. All rights reserved.</p></div></footer>
</main> 
  );
};

export default HomePage;
