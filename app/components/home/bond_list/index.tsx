"use client";
import React from "react";
import useSWR from "swr";
import BondItem from "@/app/components/bond_item";

//Set up SWR to run the fetcher function when calling "/api/staticdata"
//There are 3 possible states: (1) loading when data is null (2) ready when the data is returned (3) error when there was an error fetching the data

const fetcher = (url: any) => fetch(url).then((res) => res.json());

function CompliantBonds() {
  const { data, error } = useSWR("/api/staticdata", fetcher);
  let placeholder;

  //Handle the error state
  if (error) {
    // console.log(error);
    return <div>Failed to load</div>;
  }
  //Handle the loading state
  if (!data) return <div>Loading...</div>;
  //Handle the ready state and display the result contained in the data object mapped to

  var bonds = JSON.parse(data);
  // console.log(Object.keys(bonds.tokens).length);

  if (Object.keys(bonds.tokens).length < 3) {
    return (
      <ul className="flex space-x-4">
        {bonds.tokens.map((bond: any) => (
          <div className="w-96" key={bond.id.toString()}>
            {/* <CompliantBond bond={bond} /> */}
            <div className="h-full rounded-lg border-solid border-[1px] border-sable-green-text">
              <BondItem bond={bond} />
            </div>
          </div>
        ))}
        <div className="w-96 h-full rounded-lg bg-sable-green-placeholder">
          <div className="h-full group p-4 lg:p-8 w-[350px]"></div>
        </div>
      </ul>
    );
  } else {
    <ul className="flex space-x-4">
      {bonds.tokens.map((bond: any) => (
        <div className="w-96" key={bond.id.toString()}>
          {/* <CompliantBond bond={bond} /> */}
          <div className="h-full rounded-lg border-solid border-[1px] border-sable-green-text">
            <BondItem bond={bond} />
          </div>
        </div>
      ))}
    </ul>; // or any other component or element
  }
}

export default CompliantBonds;
