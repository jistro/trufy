import { Button } from "@radix-ui/themes";
import styles from "../styles/Home.module.css";
import React, { useRef, useState } from "react";
import CryptoJS from "crypto-js";
import { config } from "../wagmi";
import { getAccount } from "@wagmi/core";
import OpenAI from "openai";

interface CriteriaType {
  activity_score: number;
  identity_score: number;
  nominations_received_count: number;
  passport_id: number;
  score: number;
  skills_score: number;
  verified_wallets: number;
}

type RoleType = "0x01" | "0x02" | "0x03" | "0x04";

const profileCriteria: Record<RoleType, CriteriaType> = {
  "0x01": {
    // Developer
    activity_score: 20,
    identity_score: 60,
    nominations_received_count: 100,
    passport_id: 2000,
    score: 150,
    skills_score: 75,
    verified_wallets: 10,
  },
  "0x02": {
    // Designer
    activity_score: 15,
    identity_score: 40,
    nominations_received_count: 10,
    passport_id: 2500,
    score: 75,
    skills_score: 30,
    verified_wallets: 3,
  },
  "0x03": {
    // Community Manager
    activity_score: 25,
    identity_score: 100,
    nominations_received_count: 25,
    passport_id: 1500,
    score: 75,
    skills_score: 20,
    verified_wallets: 3,
  },
  "0x04": {
    // Marketing
    activity_score: 30,
    identity_score: 100,
    nominations_received_count: 25,
    passport_id: 2000,
    score: 75,
    skills_score: 25,
    verified_wallets: 3,
  },
};

interface ProfileData {
  userName: string;
  profilePictureUrl: string;
  identityScore: number;
  skillsScore: number;
  activityScore: number;
  mainWallet: string;
}

interface HashResult {
  hash: string;
  fileName: string;
  fileSize: number;
  timestamp: string;
}

interface ReadDataProps {
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData | null>>;
  profileData: ProfileData | null;
  setRole: React.Dispatch<React.SetStateAction<string>>;
  role: string;
  setHashPdf: React.Dispatch<React.SetStateAction<string | null>>;
  hashPdf: string | null;
  rankOfUser: string | null;
  setRankOfUser: React.Dispatch<React.SetStateAction<string | null>>;
}

interface ReadDataProps {
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData | null>>;
  profileData: ProfileData | null;
  setRole: React.Dispatch<React.SetStateAction<string>>;
  role: string;
  //const [hashPdf, setHashPdf] = useState<string | null>(null);
  setHashPdf: React.Dispatch<React.SetStateAction<string | null>>;
  hashPdf: string | null;
  rankOfUser: string | null;
  setRankOfUser: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ReadData: React.FC<ReadDataProps> = ({
  setProfileData,
  profileData,
  setRole,
  role,
  setHashPdf,
  hashPdf,
  rankOfUser,
  setRankOfUser,
}) => {
  const [hashResult, setHashResult] = useState<HashResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [answerPrompt, setAnswerPrompt] = useState<string | null>(null);

  const getPassport = async () => {
    const wallet = getAccount(config);
    const id = (document.getElementById("passportID") as HTMLInputElement)
      .value;
    console.log("getPassport");
    try {
      const response = await fetch(
        `https://api.talentprotocol.com/api/v2/passports/${id}`,
        //`https://api.talentprotocol.com/api/v2/passports/1027`,
        {
          headers: {
            "X-API-KEY": process.env.NEXT_PUBLIC_TALENT_API || "",
          },
        }
      );

      const data = await response.json();
      console.log("data:", data);
      const scoreAnalysis = calculateProfileScore(data);
      setAnalysisResult(scoreAnalysis);

      console.log("Analysis result:", analysisResult);

      //return data;

      const aux = {
        userName: data.passport.user.name,
        profilePictureUrl: data.passport.user.profile_picture_url,
        identityScore:
          data.passport.identity_score >= 20
            ? 20
            : data.passport.identity_score,
        skillsScore: data.passport.skills_score,
        activityScore: data.passport.activity_score,
        mainWallet: data.passport.main_wallet,
      };
      console.log(aux.mainWallet);
      //see type of id.address
      console.log(typeof wallet.address);
      console.log(wallet.address);
      console.log(typeof aux.mainWallet);

      //si wallet.address es undefined, no se puede comparar con aux.mainWallet
      if (!wallet.address) {
        console.log("Error: Wallet address is undefined");
        return;
      }
      //compare strings
      if (
        wallet.address &&
        aux.mainWallet.toLowerCase() !== wallet.address.toLowerCase()
      ) {
        console.log(
          "Error: The wallet address does not match the passport's main wallet address"
        );
        return;
      }

      setProfileData(aux);

      console.log("Datos extraídos:", profileData);
      return profileData;
    } catch (error) {
      console.error("Error fetching passport:", error);
      throw error;
    }
  };

  const calculateProfileScore = (data: any) => {
    try {
      const passport = data.passport;
      const criteria = profileCriteria[role as RoleType];

      if (!criteria) {
        throw new Error("Invalid profile type.");
      }

      const normalize = (value: number, max: number) =>
        Math.min((value || 0) / max, 1);

      const scores = {
        activity_score: normalize(
          passport.activity_score,
          criteria.activity_score
        ),
        identity_score: normalize(
          passport.identity_score,
          criteria.identity_score
        ),
        nominations: normalize(
          passport.nominations_received_count,
          criteria.nominations_received_count
        ),
        score: normalize(passport.score, criteria.score),
        skills: normalize(passport.skills_score, criteria.skills_score),
        wallets: normalize(
          passport.verified_wallets.length,
          criteria.verified_wallets
        ),
      };

      const totalScore =
        Object.values(scores).reduce((sum, score) => sum + score, 0) /
        Object.keys(scores).length;
      console.log("Total score:", totalScore);
      console.log("Scores:", scores);

      const prompt = `On a scale of 1 to 5, how relevant is the following text to the profession developer, designer, community manager, or marketing? Only provide the name of best fit:\n\n"activity on chain ${scores.activity_score}"\n"nominations ${scores.nominations}"\n"score ${scores.score}"\n"programing skills ${scores.skills}"\n"wallets ${scores.wallets}"\n"All numbers are between 0 and 1."`;
      console.log("Prompt:", prompt);

      console.log(callgpt(prompt));

      return {
        factor: Math.max(0.1, Math.min(totalScore, 1)),
        scores,
      };
    } catch (error) {
      console.error("Error calculating profile score:", error);
      throw error;
    }
  };

  async function callgpt(prompt = "You are a helpful assistant.") {
    try {
      const openai = new OpenAI({
        apiKey: //USING NEXT_PUBLIC_TALENT_OPEN_API
          process.env.NEXT_PUBLIC_TALENT_OPEN_API || "",
        dangerouslyAllowBrowser: true,
      });

      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-3.5-turbo", // o "gpt-4" si tienes acceso
        temperature: 0.7,
        max_tokens: 500,
      });
      console.log("Completion:", completion.choices[0].message.content);
      setAnswerPrompt(completion.choices[0].message.content);
      // Retorna el objeto completo como en tu ejemplo
      return {
        success: true,
        response: {
          id: completion.id,
          object: completion.object,
          created: completion.created,
          model: completion.model,
          system_fingerprint: completion.system_fingerprint,
          choices: completion.choices,
          usage: completion.usage,
        },
      };
    } catch (error) {
      console.error("Error en callgpt:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  const calculatePDFHash = async (file: File): Promise<string> => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      const hash = CryptoJS.SHA256(wordArray).toString();

      const result = {
        hash: hash,
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString(),
      };

      setHashResult(result);
      setHashPdf(hash); // Actualizar hashPdf directamente aquí

      return hash;
    } catch (error) {
      console.error("Error al calcular el hash:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getScore = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (file && file.type === "application/pdf") {
      const hash = await calculatePDFHash(file);
      console.log("Hash calculado:", hash);

      // Ahora calculamos el score después de tener el hash
      const pointsInTotal =
        (profileData?.identityScore === 20 ? 15 : 0) +
        (role === "0x01"
          ? profileData?.skillsScore ?? 0
          : profileData?.activityScore ?? 0);

      console.log("Points in total:", pointsInTotal);

      if (role === "0x01") {
        if (pointsInTotal >= 68 && hash) {
          setRankOfUser("S");
        } else if (pointsInTotal >= 51 && pointsInTotal < 68 && hash) {
          setRankOfUser("A");
        } else if (pointsInTotal > 0 && pointsInTotal < 51) {
          setRankOfUser("B");
        } else if (pointsInTotal >= 51 && !hash) {
          setRankOfUser("B");
        } else {
          setRankOfUser("C");
        }
      } else {
        if (pointsInTotal >= 96 && hash) {
          setRankOfUser("S");
        } else if (pointsInTotal >= 86 && pointsInTotal < 96 && hash) {
          setRankOfUser("A");
        } else if (pointsInTotal > 0 && pointsInTotal < 86 && hash) {
          setRankOfUser("B");
        } else if (pointsInTotal >= 86 && !hash) {
          setRankOfUser("B");
        } else {
          setRankOfUser("C");
        }
      }
    } else if (!file) {
      // Si no hay archivo, calculamos el score sin hash
      const pointsInTotal =
        (profileData?.identityScore === 20 ? 15 : 0) +
        (role === "0x01"
          ? profileData?.skillsScore ?? 0
          : profileData?.activityScore ?? 0);

      if (role === "0x01") {
        if (pointsInTotal > 0 && pointsInTotal < 51) {
          setRankOfUser("B");
        } else if (pointsInTotal >= 51) {
          setRankOfUser("B");
        } else {
          setRankOfUser("C");
        }
      } else {
        if (pointsInTotal > 0 && pointsInTotal < 86) {
          setRankOfUser("B");
        } else if (pointsInTotal >= 86) {
          setRankOfUser("B");
        } else {
          setRankOfUser("C");
        }
      }
    }
  };

  return (
    <div className={styles.containerLogIn}>
      <img
        src={profileData ? profileData.profilePictureUrl : "user.png"}
        alt="user"
        className={styles.imgUser}
      />
      {profileData ? (
        <>
          <h2>Hi {profileData.userName}</h2>
          <h3>Identity Score: {profileData.identityScore}</h3>
          <h3>Skills Score: {profileData.skillsScore}</h3>
          <h3>Activity Score: {profileData.activityScore}</h3>

          <h4
            style={{
              marginTop: "15px",
            }}
          >
            Upload your credential (if you have one)
          </h4>
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            className={styles.getFile}
          />

          {answerPrompt && (
            <p>
              by our analysis, the best score for you is: <b>{answerPrompt}</b>
            </p>
          )}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={styles.selectRole}
          >
            <option value="0x01">Devevoper</option>
            <option value="0x02">Designer</option>
            <option value="0x03">Community Manager</option>
            <option value="0x04">Marketing</option>
          </select>

          <Button
            onClick={getScore}
            color="brown"
            size="4"
            style={{ marginTop: "20px" }}
          >
            Calculate
          </Button>
        </>
      ) : (
        <>
          <h4>Enter your Talent Passport ID</h4>
          <input
            type="number"
            placeholder="70"
            id="passportID"
            className={styles.inputTPID}
          />
          <Button
            onClick={getPassport}
            color="brown"
            size="4"
            style={{ marginTop: "10px" }}
          >
            Get Passport
          </Button>
        </>
      )}
    </div>
  );
};
