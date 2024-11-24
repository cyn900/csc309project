# Use an official R runtime as the base image
FROM r-base:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install any necessary R packages
RUN Rscript -e "install.packages('ggplot2', repos='http://cran.rstudio.com/')"

# Default command
CMD ["Rscript", "main.R"]
