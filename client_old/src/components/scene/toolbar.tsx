import './toolbar.scss';

type Props = {
    mousePosition: { x: number, y: number };
};

const Toolbar = ({ mousePosition }: Props) => {
  return (
    <div className='toolbar'>
        Mouse (world position): ({Math.round(mousePosition.x)}, {Math.round(mousePosition.y)})
    </div>
  )
};

export default Toolbar;
