"use client";
import React, { useState } from "react";
import { hideBond } from "@/app/redux/features/displayBondSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, useAppSelector } from "@/app/redux/store";
import useSWR from "swr";
import { FaNewspaper } from "react-icons/fa";
import { BsFillBagFill } from "react-icons/bs";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { AiOutlineClose } from "react-icons/ai";
import QuantityPicker from "./quantity_picker";
import Slider from "./slider";

const fetcher = (url: any) => fetch(url).then((res) => res.json());

function Bond() {
  const dispatch = useDispatch<AppDispatch>();
  const isDisplayed = useAppSelector((state) => state.displayBondReducer.value);

  const { data, error } = useSWR("/api/staticdata", fetcher);
  let placeholder;

  const [numberTokens, setNumberToken] = useState<number>(0);

  const updateTokenNumber = (number: number) => {
    setNumberToken(number);
  };

  //Handle the error state
  if (error) {
    // console.log(error);
    return <div>Failed to load</div>;
  }
  //Handle the loading state
  if (!data) return <div>Loading...</div>;
  //Handle the ready state and display the result contained in the data object mapped to

  var bonds = JSON.parse(data);
  var result = bonds.tokens.find(function (token: any) {
    return token.id == parseInt(isDisplayed.bondId);
  });

  const closeBond = () => {
    if (isDisplayed.isOpen) {
      dispatch(hideBond());
    }
  };
  return (
    <div className="backdrop-blur-lg fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="p-4 rounded-lg shadow-lg xl:h-3/4 xl:w-1/3">
        <button
          onClick={closeBond}
          className="flex mt-2 px-1 py-1 text-white rounded justify-end w-full"
        >
          <AiOutlineClose className="text-sable-green-secondary-text hover:bg-green-600" />
        </button>
        <div className="flex">
          <div className="bg-sable-green-text aspect-[2/2] w-32 border-[1px] border-sable-green-text rounded-md mr-1" />
          <div className="flex flex-col xl:w-80 space-y-4 ml-5">
            <div className="flex">
              <h3 className="text-xl text-gray-50 mr-4 ">{result.name}</h3>
              <div className="flex items-center mx-4 text-l text-gray-500">
                $TOKEN
              </div>
            </div>
            <div className="text-l text-gray-300">{result.supply} SUPPLY</div>
            <a href="" className="text-l text-gray-500 underline ">
              view on solscan
            </a>
          </div>
        </div>

        <form className="flex my-4">
          <div className="px-1 w-2/7">
            <label
              htmlFor="bondtype"
              className="block mb-2 text-xs text-white-100"
            >
              bondtype
            </label>
            <input
              readOnly
              type="text"
              id="bondtype"
              value={result.bondtype}
              className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
              required
            />
          </div>
          <div className="px-1 w-2/7">
            <label
              htmlFor="issue_date"
              className="block mb-2 text-xs text-white-100"
            >
              issue date
            </label>
            <input
              readOnly
              type="text"
              id="issue_date"
              value={result.issuedate}
              className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
              required
            />
          </div>
          <div className="px-1 w-2/7">
            <label
              htmlFor="expiry_date"
              className="block mb-2 text-xs text-white-100"
            >
              expiry date
            </label>
            <input
              readOnly
              type="text"
              id="expiry_date"
              className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
              value={result.expirydate}
              required
            />
          </div>
          <div className="px-1 w-1/7">
            <label htmlFor="apy" className="block mb-2 text-xs text-white-100">
              apy
            </label>
            <input
              readOnly
              type="text"
              id="apy"
              className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
              value={result.apy}
              required
            />
          </div>
        </form>
        <div className="flex justify-between text-xs p-2.5">
          <span className=" flex m-1 ml-0 inline-block text-white-500 items-center">
            <div className="flex items-center text-green-500 bg-green-800 p-1 rounded-lg">
              <BsFillBagFill />
            </div>
            +50,000 $TOKEN per Bond
          </span>
          <span className="flex m-1 ml-0 inline-block text-white-500 items-center">
            <div className="flex items-center text-green-500 bg-green-800 p-1 rounded-lg">
              <HiOutlineBanknotes />
            </div>
            -1.25 $SOL per Bond
          </span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#101919]">
          <span className="text-sm font-small text-gray-50">
            250,000 $TOKEN Supply Remaining
          </span>
          <a className="font-medium text-sable-green-secondary-text transition-all duration-300 group-hover:text-sable-green-placeholder">
            <FaNewspaper />
          </a>
        </div>

        <QuantityPicker
          numberTokens={numberTokens}
          updateTokenNumber={updateTokenNumber}
        />

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#101919] text-sm text-gray-500">
          By purchasing NUMBER x $TOKEN bons you acknowledge and aggree to
          receive 100,000 $TOKEN, plus notified yield. Sable Bonds are
          non-refundable permission is primitive. You are responsible for all
          purchases on this platform.
        </div>

        <div className="flex">
          <Slider />
        </div>
      </div>
    </div>
  );
}

export default Bond;
