"use client";
import React from "react";
import useSWR from "swr";
import { BiSolidAddToQueue } from "react-icons/bi";
import BondItem from "@/app/components/bond_item";

//Set up SWR to run the fetcher function when calling "/api/staticdata"
//There are 3 possible states: (1) loading when data is null (2) ready when the data is returned (3) error when there was an error fetching the data

const fetcher = (url: any) => fetch(url).then((res) => res.json());

function CompliantBonds() {
  const { data, error } = useSWR("/api/staticdata", fetcher);

  //Handle the error state
  if (error) {
    // console.log(error);
    return <div>Failed to load</div>;
  }
  //Handle the loading state
  if (!data) return <div>Loading...</div>;
  //Handle the ready state and display the result contained in the data object mapped to

  var bonds = JSON.parse(data);
  // console.log(bonds);

  if (Object.keys(bonds.tokens).length < 3) {
    return (
      <ul className="flex space-x-4">
        {bonds.tokens.map((bond: any) => (
          <div
            className="w-96 h-full rounded-lg bg-sable-green-placeholder"
            key={bond.id.toString()}
          >
            <BondItem bond={bond} />
          </div>
        ))}
        <div className="h-full rounded-lg bg-sable-green-placeholder">
          <div className="flex flex-col h-full group p-4 lg:p-8 w-[350px] items-center justify-center text-sable-green-secondary-text">
            <BiSolidAddToQueue className="text-5xl" />
            issue new bond
          </div>
        </div>
      </ul>
    );
  } else {
    <ul className="flex space-x-4">
      {bonds.tokens.map((bond: any) => (
        <div
          className="w-96 h-full rounded-lg bg-sable-green-placeholder"
          key={bond.id.toString()}
        >
          <BondItem bond={bond} />
        </div>
      ))}
    </ul>; // or any other component or element
  }
}

export default CompliantBonds;
