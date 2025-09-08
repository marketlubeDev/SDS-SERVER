class APIFeatures {
  constructor(model, query, queryStr) {
    this.model = model;
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObj = { ...this.queryStr };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "field",
      "startDate",
      "endDate",
      "search",
      "name",
      "title",
      "description",
    ];

    excludedFields.forEach((el) => delete queryObj[el]);

    this.query = this.query.find(queryObj);

    return this;
  }
  search() {
    if (this.queryStr.search === "") return this;
    if (
      this.queryStr.search &&
      typeof this.queryStr.search === "string" &&
      this.queryStr.search.trim() !== ""
    ) {
      if (multipleKeywords.includes(this.queryStr.search)) {
        // Find documents where the branches array length is greater than 1
        this.query = this.query.find({
          $expr: {
            $gt: [{ $size: "$branches" }, 1],
          },
        });
        return this; // Exit early since the search for "Multiple" is handled
      }
      const escapedSearch = this.queryStr.search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const searchRegex = new RegExp(this.queryStr.search, "i");

      const searchQuery = {
        $or: [
          { purpose: { $regex: searchRegex } },
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { title: { $regex: searchRegex } },
          { remark: { $regex: searchRegex } },
          { bank: { $regex: searchRegex } },
          { branch: { $regex: searchRegex } },
          { branchName: { $regex: searchRegex } },
          { type: { $regex: searchRegex } },
          { agent: { $regex: searchRegex } },
          { counsillor: { $regex: searchRegex } },
          { currency: { $regex: searchRegex } },
          { student: { $regex: searchRegex } },
          { intakeMonth: { $regex: searchRegex } },
          { country: { $regex: searchRegex } },
          { subCategory: { $regex: searchRegex } },
          { category: { $regex: searchRegex } },
          {
            paymentStatus: {
              $regex: `^${escapedSearch.substring(0, 4)}`,
              $options: "i",
            },
          },
          {
            orderStatus: {
              $regex: searchRegex,
              $options: "i",
            },
          },
          {
            status: {
              $regex: `^${escapedSearch.substring(0, 4)}`,
              $options: "i",
            },
          },
          { "branches.branchName": { $regex: searchRegex } },
          { "particular.name": { $regex: searchRegex } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$amount" },
                regex: this.queryStr.search,
                options: "i",
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$receivable" },
                regex: this.queryStr.search,
                options: "i",
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$courseFee" },
                regex: this.queryStr.search,
                options: "i",
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$inr" },
                regex: this.queryStr.search,
                options: "i",
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$commition" },
                regex: this.queryStr.search,
                options: "i",
              },
            },
          },
        ],
      };
      this.query = this.query.find(searchQuery);
    }
    return this;
  }
  sort() {
    if (this.queryStr.sort) {
      const sortingItems = this.queryStr.sort.split("%").join(" ");
      this.query = this.query.sort(sortingItems);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.field) {
      const fields = this.queryStr.field.split("%").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate(count) {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 24;
    const skip = (page - 1) * limit;

    if (this.queryStr.page) {
      if (count <= skip) throw new Error("Page does not exist");
    }
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  // New method to filter by branch
  filterByBranch() {
    if (this.queryStr.branch) {
      const branchName = this.queryStr.branch;
      this.query = this.query.find({
        branches: { $elemMatch: { branchName } },
      });
    }
    return this;
  }
  filterByDateRange() {
    if (this.queryStr.startDate || this.queryStr.endDate) {
      let dateFilter = {};

      let timezone = "Asia/Kolkata";

      if (this.queryStr.startDate) {
        // Parse the date string and treat it as local time (IST)
        const startDate = new Date(this.queryStr.startDate);
        // Create start of day in the same timezone as the input
        dateFilter.$gte = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          0,
          0,
          0,
          0,
          timezone
        );
      }

      if (this.queryStr.endDate) {
        // Parse the date string and treat it as local time (IST)
        const endDate = new Date(this.queryStr.endDate);
        // Create end of day in the same timezone as the input
        dateFilter.$lte = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59,
          999,
          timezone
        );
      }

      this.query = this.query.find({
        createdAt: dateFilter,
      });
    }
    return this;
  }
}

export default APIFeatures;
