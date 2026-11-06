package cat.esliceu.drawing.demo.models;


import java.util.List;

enum typeFigure {
    CIRCLE,
    SQUARE,
    TRIANGLE,
    RECTANGLE,
    STAR,
    LINE,
    ELLIPSE,
    OTHER
}

abstract class Figure {

    private String id;
    private String name;
    private String color;
    private double posX;
    private double posY;

    public Figure(String id, String name, String color, double posX, double posY) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.posX = posX;
        this.posY = posY;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public double getPosX() {
        return posX;
    }

    public void setPosX(double posX) {
        this.posX = posX;
    }

    public double getPosY() {
        return posY;
    }

    public void setPosY(double posY) {
        this.posY = posY;
    }

    public abstract typeFigure getType();
}

class Circle extends Figure {
    private double radio;

    public Circle(String id, String name, String color, double posX, double posY, double radio) {
        super(id, name, color, posX, posY);
        this.radio = radio;
    }



    public double getRadio() {
        return radio;
    }

    public void setRadio(double radio) {
        this.radio = radio;
    }

    @Override
    public typeFigure getType(){
        return typeFigure.CIRCLE;
    }
}

class Square extends Figure{

    private double size;

    public Square(String id, String name, String color, double posX, double posY, double size) {
        super(id, name, color, posX, posY);
        this.size = size;
    }

    @Override
    public typeFigure getType() {
        return typeFigure.SQUARE;
    }

    public double getSize() {
        return size;
    }

    public void setSize(double size) {
        this.size = size;
    }
}

class Triangle extends Figure {

    private double base;
    private double height;

    public double getBase() {
        return base;
    }

    public void setBase(double base) {
        this.base = base;
    }

    public double getHeight() {
        return height;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public Triangle(String id, String name, String color, double posX, double posY, double base, double height) {
        super(id, name, color, posX, posY);
        this.base = base;
        this.height = height;
    }

    @Override
    public typeFigure getType() {
        return typeFigure.TRIANGLE;
    }
}

class Star extends Figure {

    private double internRadio;
    private double externRadio;

    public double getInternRadio() {
        return internRadio;
    }

    public void setInternRadio(double internRadio) {
        this.internRadio = internRadio;
    }

    public double getExternRadio() {
        return externRadio;
    }

    public void setExternRadio(double externRadio) {
        this.externRadio = externRadio;
    }

    public Star(String id, String name, String color, double posX, double posY, double internRadio, double externRadio) {
        super(id, name, color, posX, posY);
        this.internRadio = internRadio;
        this.externRadio = externRadio;
    }

    @Override
    public typeFigure getType() {
        return typeFigure.STAR;
    }
}

