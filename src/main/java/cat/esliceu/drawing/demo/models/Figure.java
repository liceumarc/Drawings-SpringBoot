package cat.esliceu.drawing.demo.models;


public abstract class Figure {

    private enum typeFigure {
        CIRCLE,
        SQUARE,
        TRIANGLE,
        RECTANGLE,
        POLYGON,
        LINE,
        ELLIPSE,
    }

    private String name;
    private typeFigure type;
    private int coordX;
    private int coordY;
    private String color;
    private int size;

    public Figure(String name, typeFigure type, int coordX, int coordY, String color, int size) {
        this.name = name;
        this.type = type;
        this.coordX = coordX;
        this.coordY = coordY;
        this.color = color;
        this.size = size;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public typeFigure getType() {
        return type;
    }

    public void setType(typeFigure type) {
        this.type = type;
    }

    public int getCoordX() {
        return coordX;
    }

    public void setCoordX(int coordX) {
        this.coordX = coordX;
    }

    public int getCoordY() {
        return coordY;
    }

    public void setCoordY(int coordY) {
        this.coordY = coordY;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }
}