import { Button } from "@radix-ui/themes";
import styles from "../styles/Home.module.css";
import React, { useRef } from "react";
import { useSignMessage } from "wagmi";
import CryptoJS from "crypto-js";
import { config } from "../wagmi";
import { getAccount } from "@wagmi/core";

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
  setHashResult: React.Dispatch<React.SetStateAction<HashResult | null>>;
  hashResult: HashResult | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

export const ReadData: React.FC<ReadDataProps> = ({
  setProfileData,
  profileData,
  setRole,
  role,
  setHashPdf,
  setHashResult,
  setIsLoading,
  hashPdf,
  hashResult,
  isLoading,
  
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            "X-API-KEY":
              "a43ec4a262562b2c0104853b997d1b689d65af9e772f3c859261c975af4a",
          },
        }
      );

      const data = await response.json();
      console.log("data:", data);
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

  const calculatePDFHash = async (file: File): Promise<string> => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      const hash = CryptoJS.SHA256(wordArray).toString();

      setHashResult({
        hash: hash,
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString(),
      });

      setHashPdf(hash);
      console.log("Hash del archivo:", hash);
      return hash;
    } catch (error) {
      console.error("Error al calcular el hash:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateScore = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (file && file.type === "application/pdf") {
      await calculatePDFHash(file);
    } else {
      alert("Please upload a PDF file");
    }
  };

  const getScore = async () => {
    handleCalculateScore();
    console.log("Hash del archivo:", hashPdf);
    console.log("Role:", role);
  }

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

          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            className={styles.getFile}
          />

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

          <Button onClick={getScore}>Calculate Score</Button>
        </>
      ) : (
        <>
          <input
            type="number"
            placeholder="70"
            id="passportID"
            className={styles.inputTPID}
          />
          <Button onClick={
            getPassport
          }>Get Passport</Button>
        </>
      )}
    </div>
  );
};