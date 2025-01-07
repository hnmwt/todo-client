"use client"
import Todo from "./components/todo";
import { InputLocType, TodoType } from "./types";
import React, { useEffect, useRef, useState } from "react";
import { useTodos } from "./hooks/useTodos";
import { API_URL } from "@/constants/url";
// import { getPosition } from "./hooks/geo";
import { APIProvider, APIProviderContext, Map } from "@vis.gl/react-google-maps";

const kousokuSuffixes = ["自動車道", "高速道路"];

const inputClass = `appearance-none bg-transparent
      border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight
      focus:outline-none`;

export default function Home() {

  // 現在地取得処理
  function getPosition(geoRef: React.RefObject<GeolocationPosition | null>) {
    // if (navigator.geolocation) {
    //   // alert("この端末では位置情報が取得できます");
    // // Geolocation APIに対応していない
    // } else {
    //   alert("この端末では位置情報が取得できません");
    //   return;
    // }
    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
      // 取得成功した場合
      function (position) {
        geoRef.current = position;
        return;
        alert("緯度:" + position.coords.latitude + ",経度" + position.coords.longitude);
      },
      // 取得失敗した場合
      function (error) {
        switch (error.code) {
          case 1: //PERMISSION_DENIED
            alert("位置情報の利用が許可されていません");
            break;
          case 2: //POSITION_UNAVAILABLE
            alert("現在位置が取得できませんでした");
            break;
          case 3: //TIMEOUT
            alert("タイムアウトになりました");
            break;
          default:
            alert("その他のエラー(エラーコード:" + error.code + ")");
            break;
        }
      }
    );
  }

  const geoRef = useRef<GeolocationPosition | null>(null);
  getPosition(geoRef);

  const mapRef = useRef<HTMLDivElement | null>(null);

  const inputLocRef = useRef<InputLocType>({
    origin: "",
    dest: "",
    waypoint: []
  });
  const [outputLocRef, setOutputLocRef] = useState<google.maps.DirectionsResult | null>(null);
  // const outputocRef=useRef<google.maps.DirectionsResult|null>(null);
  // let outputocRef;
  const tokyoLoc = {
    latitude: 35.658581,
    longitude: 139.745433
  };
  const googleMap = (geoRef: React.RefObject<GeolocationPosition | null>) => {
    let latitude, longitude;
    if (geoRef?.current?.coords?.latitude === undefined ||
      geoRef?.current?.coords?.longitude === undefined
    ) {
      latitude = tokyoLoc.latitude;
      longitude = tokyoLoc.longitude;
    } else {
      latitude = geoRef.current?.coords?.latitude;
      longitude = geoRef.current?.coords?.longitude;
    }

    return <div ref={mapRef}>
      <APIProvider apiKey={process!.env!.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} region="jp">
        <Map
          id="map"
          style={{ width: '70vw', height: '50vh' }}
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={15}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        />
      </APIProvider>
    </div>
  };

  const routing = () => {
    var tokyo = new google.maps.LatLng(tokyoLoc.latitude, tokyoLoc.longitude);
    const mapOptions = {
      zoom: 7,
      center: tokyo
    }

    const mapElm = document.getElementById('map');
    if (!mapElm) return;
    const map = new google.maps.Map(mapElm, mapOptions);

    const directionsRenderer = new google.maps.DirectionsRenderer();
    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: {
        query: inputLocRef.current.origin,
      },
      destination: {
        query: inputLocRef.current.dest,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    }).then((response) => {
      directionsRenderer.setDirections(response);
      setOutputLocRef(response);
      console.log('response', response)
    }).catch((e) => window.alert("Directions request failed due to " + status));
    directionsRenderer.setMap(map);
  }


  const originRef = useRef<HTMLInputElement | null>(null);
  const destRef = useRef<HTMLInputElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { todos, isLoading, error, mutate } = useTodos();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !(e.target instanceof HTMLInputElement)) return;

    if (e.target.id === "inputorigin") {
      inputLocRef.current.origin = e.target.value;
    } else if (e.target.id === "inputdest") {
      inputLocRef.current.dest = e.target.value;
    } else {
      alert('ng')
    }

    console.log('www', e.target)
    // inputLocRef.current.origin

    // const response = await fetch(`${API_URL}/createTodo`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     title: inputRef.current?.value,
    //     isCompleted: false,
    //   }),
    // });
    // if (response.ok) {
    //   const newTodo = await response.json();
    //   mutate([...todos, newTodo]);
    //   inputRef.current!.value = "";
    // }
  }

  const result = () => {

    let kousokuDist=0;
    console.log('result', outputLocRef)
    const ret = outputLocRef?.routes.map((v, i) => {
      return v.legs.map((v2, j) => {
        // console.log('zzzzz',`dist${i}-${j}`)
        return (<>
          <div key={`dist${i}-${j}`}>  {v2.distance?.text}</div>
          <div key={`dist2${i}-${j}`}>  {v2.duration?.text}</div>
          {v2.steps.map((v3, k) => {
         return   kousokuSuffixes.map((suffix, l) => {
              if (v3.instructions.includes(suffix)) {// 高速道路のとき
                 console.log("xxx",v3.instructions,kousokuDist)
                 kousokuDist+=v3.distance?.value?v3.distance.value:0;
                return <div key={`dist3${i}-${j}-${k}-${l}`}>{v3.instructions}{v3.distance?.value}</div>
              }
            })
          })}
        </>)
      })
    })
    return ret;
  }

  return (
    <div>
      <APIProvider apiKey={process!.env!.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}></APIProvider>

      {/* 地図 */}
      <div>
        <h1>位置情報取得サンプル</h1>
        {`緯度:${geoRef.current?.coords.latitude} 経度 ${geoRef.current?.coords.longitude}`}
      </div>

      {googleMap(geoRef)}
      <span>出発地</span>
      <input
        id="inputorigin"
        ref={originRef}
        className={inputClass}
        type="text"
        placeholder="Add a task"
        onChange={(e) => handleSubmit(e)}
      />

      <span>目的地</span>
      <input
        id="inputdest"
        ref={destRef}
        className={inputClass}
        type="text"
        placeholder="Add a task"
        onChange={(e) => handleSubmit(e)}
      />

      <button
        type="submit"
        className="duration-150 flex-shrink-0 bg-blue-500 hover:bg-blue-700 border-blue-500 hover:border-blue-700 text-sm border-4 text-white py-1 px-2 rounded"
        onClick={routing}
        // disabled={inputLocRef?.current?.origin==""||inputLocRef?.current?.dest==""}
      >決定
      </button>

      <div>結果</div>
      {result()}


    </div>
  )
}
