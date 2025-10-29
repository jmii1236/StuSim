import {useState}  from "react";

type ToggleSliderProps = {
    onChecked: () => void;
    isChecked: boolean,
    tooltip: string
}

function ToggleSlider({onChecked, isChecked, tooltip}: ToggleSliderProps) {

    return (
        <>
        <label className='flex cursor-pointer select-none items-center'>
            <div className='relative'>
            <input
                type='checkbox'
                checked={isChecked}
                onChange={onChecked}
                className='sr-only'
            />
            <div
                className={`box block h-5 w-10 rounded-full ${
                isChecked ? 'bg-primary' : 'bg-stone-300'
                }`}
                title={tooltip}
            ></div>
            <div
                className={`absolute left-[0.125rem] top-[0.125rem] flex h-4 w-4 items-center justify-center rounded-full bg-white transition ${
                isChecked ? 'translate-x-5' : ''
                }`}
            ></div>
            </div>
        </label>
        </>
    )
}

export { ToggleSlider }